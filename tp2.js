/* Fichier gabarit pour le TP2 - Planète X du cours INF5071 (A2020)
Cherchez les mentions "TODO" et "COMPLÉTEZ LE CODE" dans ce fichier trouver
le code à compléter ou les tâches à réaliser.
 */

var camera;
var nLatitude = 32; // Nombre de côté de la sphère (Sud-Nord, parallèle aux latitudes)
var nLongitude = 64; // Nombre de côté de la sphère (Est-Ouest, parallèle aux longitudes)
var rayon = 0.5; // Rayon de la sphère
var planeteIFS; // Structure de données pour la sphère
var satelliteIFS; // Structure de données pour le satellite
var n_stars = 128; // Nombre d'étoiles à générer
// Structure de données pour recevoir les positions, couleurs et taille  des étoiles
var stars = {x: [], y: [], z: [], color: [], size:[]}

var T = 10 // Durée du jour pour la planète (en s). Une rotation s'effectue en T secondes.

// Angles et vitesses de rotation pour le satellite
var satAngleX = 0; // Angle de rotation autour de l'axe X
var satAngleY = 0; // Angle de rotation autour de l'axe Y
var satAngleZ = 0; // Angle de rotation autour de l'axe Z
var satSpeedX = 1; // Vitesse de rotation autour de l'axe X
var satSpeedY = 0.1; // Vitesse de rotation autour de l'axe Y
var satSpeedZ = 0.3; // Vitesse de rotation autour de l'axe Z

var fichier_texture = "tp2_texture_planete.jpg" // Fichier de texture à appliquer à la planète
var fichier_satellite = "tp2_satellite.obj" // Fichier .obj exporté depuis blender


/* a) Géométrique d'une sphère  */
function uvSphere(radius, nLongitude, nLatitude) {
    var vertexCount = (nLongitude + 1) * (nLatitude + 1);
    var vertices = new Float32Array(3 * vertexCount);
    var normals = new Float32Array(3 * vertexCount);
    var texCoords = new Float32Array(2 * vertexCount);
    var indices = new Uint16Array(2* nLongitude * nLatitude * 3);

    var x, y, z, u, v, k1, k2;
    var du = 2 * Math.PI / nLongitude;
    var dv = Math.PI / nLatitude;
    var indexV = 0;
    var indexT = 0;
    var k = 0;

    for (var i = 0; i < nLatitude + 1; i++) {
        v = -Math.PI / 2 + i * dv;

        for (var j = 0; j < nLongitude + 1; j++) {
            u = j * du;
            
            // Équations de la surface de la sphère
            x = radius * Math.cos(u) * Math.cos(v);
            y = radius * Math.sin(u) * Math.cos(v);
            z = radius * Math.sin(v);
            
            // Sommets et vecteurs normaux
            vertices[indexV] = x;
            normals[indexV++] = x / radius;
            vertices[indexV] = y;
            normals[indexV++] = y / radius;
            vertices[indexV] = z;
            normals[indexV++] = z / radius;
            
            // Coordonnées de textures
            texCoords[indexT++] = j/ nLongitude;
            texCoords[indexT++] = i/ nLatitude;
        }
    }

    // Indices pour chaque face de la sphere
    for (var j = 0; j < nLatitude; j++) {
        k1 = j * (nLongitude + 1);
        k2 = (j + 1) * (nLongitude + 1);
        for (var i = 0; i < nLongitude; i++) {
            indices[k++] = k1 + i;
            indices[k++] = k2 + i + 1;
            indices[k++] = k2 + i;
            indices[k++] = k1 + i;
            indices[k++] = k1 + i + 1;
            indices[k++] = k2 + i + 1;
        }
    }

    return {
        vertexPositions: vertices,
        vertexNormals: normals,
        vertexTextureCoords: texCoords,
        indices: indices
    };
}

/* b) Afficher une sphère avec la méthode IFS */
function draw_planet(model) {
    // Fonction utilisée pour dessiner la planète
    glEnable(GL_TEXTURE_2D);
    glMaterialfv(GL_FRONT_AND_BACK, GL_SPECULAR, [1.0, 1.0, 1.0, 1.0]);
    glMaterialfv(GL_FRONT_AND_BACK, GL_DIFFUSE, [1.0, 1.0, 1.0, 1.0]);
    glMaterialfv(GL_FRONT_AND_BACK, GL_EMISSION, [0.0, 0.0, 0.0, 1.0]);
    glMaterialf(GL_FRONT_AND_BACK, GL_SHININESS, 16);

    glEnableClientState(GL_VERTEX_ARRAY);
    glVertexPointer(3, GL_FLOAT, 0, model.vertexPositions);
    
    glEnableClientState(GL_NORMAL_ARRAY);
    glNormalPointer(GL_FLOAT, 0, model.vertexNormals);
    
    glEnableClientState(GL_TEXTURE_COORD_ARRAY);
    glTexCoordPointer(2, GL_FLOAT, 0, model.vertexTextureCoords);
    
    glDrawElements(GL_TRIANGLES, model.indices.length, GL_UNSIGNED_INT, model.indices);
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_NORMAL_ARRAY);
    glDisableClientState(GL_TEXTURE_COORD_ARRAY);
    glDisable(GL_TEXTURE_2D);
}

/* d) Lumières et environnement */
function generate_randomStars() {
    // Fonction utilisée pour générer des étoiles aléatoirement.
    for (var i = 0; i < n_stars; i++){
        var x, y, z, c, s, r, u, v;

        r = Math.random() + 0.75;
        u = Math.random() * Math.PI * 2;
        v = Math.random() * Math.PI - Math.PI / 2;
        
        // Coordonnées de l'étoile
        x = r * Math.cos(u) * Math.cos(v);
        y = r * Math.sin(u) * Math.cos(v);
        z = r * Math.sin(v);
        
        // Taille de l'étoile
        s = Math.random() * 3 + 1;

        // Couleur d'émission de l'étoile
        t = Math.random() * 0.4 + 0.2;
        c = [t, t, t, 1];

        // Add this star
        stars.x.push(x)
        stars.y.push(y)
        stars.z.push(z)
        stars.color.push(c)
        stars.size.push(s)
    }
}

function draw_stars() {
    // Fonction utilisée pour dessiner les étoiles
    var x, y, z, c, s;
    glMaterialfv(GL_FRONT_AND_BACK, GL_SPECULAR, [1.0, 1.0, 1.0, 1.0]);
    glMaterialfv(GL_FRONT_AND_BACK, GL_DIFFUSE, [1.0, 1.0, 1.0, 1.0]);
    glMaterialf(GL_FRONT_AND_BACK, GL_SHININESS, 64);
    
    // Création des étoiles avec leurs propriétés
    glBegin(GL_POINTS);
    for (var i = 0; i < stars.x.length; i++) {
        x = stars.x[i];
        y = stars.y[i];
        z = stars.z[i];
        c = stars.color[i];
        s = stars.size[i];

        glPointSize(s);
        glMaterialfv(GL_FRONT_AND_BACK, GL_EMISSION, c);
        glVertex3f(x, y, z);
    }
    glEnd();
}

// g) Dessiner le satellite
function draw_satellite(x, y, z, scale){
    // Transformations du satellite
    glPushMatrix();
    glTranslatef(x, y, z);
    glRotatef(satAngleX, 1, 0, 0);
    glRotatef(satAngleY, 0, 1, 0);
    glRotatef(satAngleZ, 0, 0, 1);
    glScalef(scale, scale, scale);

    glEnableClientState(GL_VERTEX_ARRAY);
    glVertexPointer(3, GL_FLOAT, 0, satelliteIFS.vertexPositions);
    
    glEnableClientState(GL_NORMAL_ARRAY);
    glNormalPointer(GL_FLOAT, 0, satelliteIFS.vertexNormals);

    // Création du satellite
    glMaterialfv(GL_FRONT_AND_BACK, GL_SPECULAR, [0.4, 0.4, 0.4, 1.0]);
    glMaterialfv(GL_FRONT_AND_BACK, GL_DIFFUSE, [0.4, 0.4, 0.4, 1.0]);
    glMaterialfv(GL_FRONT_AND_BACK, GL_EMISSION, [0.0, 0.0, 0.0, 1.0]);
    glMaterialf(GL_FRONT_AND_BACK, GL_SHININESS, 32);

    glDrawElements(GL_TRIANGLES, satelliteIFS.parts['Satellite_Corps'].length, GL_UNSIGNED_INT, satelliteIFS.parts['Satellite_Corps']);
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts['Joint_Cylinder'].length, GL_UNSIGNED_INT, satelliteIFS.parts['Joint_Cylinder']);
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts['Coupole_Sphere.001'].length, GL_UNSIGNED_INT, satelliteIFS.parts['Coupole_Sphere.001']);
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts['Antenne_Cylinder.001'].length, GL_UNSIGNED_INT, satelliteIFS.parts['Antenne_Cylinder.001']);

    // Création des panneaux solaires
    glMaterialfv(GL_FRONT_AND_BACK, GL_SPECULAR, [1.0, 1.0, 1.0, 1.0]);
    glMaterialfv(GL_FRONT_AND_BACK, GL_DIFFUSE, [0.0, 0.0, 1.0, 1.0]);
    glMaterialfv(GL_FRONT_AND_BACK, GL_EMISSION, [0.0, 0.0, 0.0, 1.0]);
    glMaterialf(GL_FRONT_AND_BACK, GL_SHININESS, 64);

    glDrawElements(GL_TRIANGLES, satelliteIFS.parts['Panneau1_Cube.001'].length, GL_UNSIGNED_INT, satelliteIFS.parts['Panneau1_Cube.001']);
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts['Panneau2_Cube.002'].length, GL_UNSIGNED_INT, satelliteIFS.parts['Panneau2_Cube.002']);
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_NORMAL_ARRAY);
    glPopMatrix();

}

// Fonction principale pour dessiner la scène.
function draw() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    camera.apply();

    // d) Lumière directionnelle
    glEnable(GL_LIGHT1);
    glLightfv(GL_LIGHT1, GL_SPECULAR, [1.0, 1.0, 1.0, 1]);
    glLightfv(GL_LIGHT1, GL_DIFFUSE, [1.0, 1.0, 1.0, 1]);
    glLightfv(GL_LIGHT1, GL_AMBIENT, [0.4, 0.4, 0.4, 1]);
    glLightfv(GL_LIGHT1, GL_POSITION, [5, 0, 5, 1]);

    glRotatef(-90, 1, 0, 0); // Inverser l'axe des z

    // Draw stars
    draw_planet(planeteIFS);
    draw_stars();
    draw_satellite(0.6, -0.6, 0, 0.02);
}

// Fonction pour contrôler les animations
function update() {
    // e) Animation de la texture
    glMatrixMode(GL_TEXTURE);
    glTranslatef((1/30)/T, 0, 0);
    glMatrixMode(GL_MODELVIEW);

    // h) Animation du satellite
    satAngleX += satSpeedX;
    satAngleY += satSpeedY;
    satAngleZ += satSpeedZ;

    // À la fin, on dessine la scène et on appelle update dans 30 ms.
    draw();
    setTimeout(update, 30);
}
function init() {
    try {
        glsimUse("canvas");
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML="<p><b>Sorry, an error occurred:<br>" +
            e + "</b></p>";
        return;
    }

    // Initialisation de l'état d'OpenGL
    glEnable(GL_POINT_SMOOTH);
    glEnable(GL_LIGHTING);

    glEnable(GL_NORMALIZE);
    glEnable(GL_DEPTH_TEST);
    glClearColor(0, 0, 0, 1);

    // Configuration de la caméra
    camera = new Camera();
    camera.setScale(0.6);
    camera.lookAt(0, 0, 5);

    // Création du modèle IFS pour la planète.
    planeteIFS = uvSphere(rayon, nLongitude, nLatitude)
    // c) Importer une texture
    var image_url = fichier_texture;
    var image = new Image();
    image.onload = function() {
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, image.width, image.height,
                    0, GL_RGBA, GL_UNSIGNED_BYTE, image);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    }
    image.src = image_url;

    // Génération d'étoiles
    generate_randomStars()

    // Load the satellite
    satelliteIFS = loadOBJFile(fichier_satellite);

    // Pour l'interactivité avec la souris.
    camera.installTrackball(draw);
    update();
}