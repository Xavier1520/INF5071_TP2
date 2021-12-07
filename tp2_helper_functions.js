function loadOBJFile(url){
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
        result = xmlhttp.responseText;
    }

    // Parsing the file
    lines = result.split("\n"); // Split into lines

    // Split into models
    var models = [];
    var name = null;
    var faces = [];
    var smoothShading;
    var all_vertices = [];
    var all_textures = [];
    var all_normals = [];
    for (var i = 0; i < lines.length; i++){
        line = lines[i];
        if (line.startsWith("#") || line.startsWith("mtllib")) {
            continue;
        } else if (line.startsWith("o")) { // This is a new objects
            // First check if an object already exists
            if (name !== null ) { // Adding to the model
                model = {
                    name: name,
                    faces: faces,
                    smoothShading: smoothShading
                }
                models.push(model);
            }

            // adding a custom forth point if a triangle is givent.
            // in face, the values vertex, texture, noraml are given

            name = line.replace("o ", "");
            faces = [];
        } else if (line.startsWith("v ")){ // This is a vertex
            vertex = line.replace("v ", "");
            vertex = vertex.split(" ");
            for (var j = 0; j < vertex.length; j++){
                vertex[j] = parseFloat(vertex[j])
            }
            all_vertices.push(vertex);
        }
        else if (line.startsWith("vt ")){ // This is a texture coordinates
            texture = line.replace("vt ", "");
            texture = texture.split(" ");
            for (var j = 0; j < texture.length; j++){
                texture[j] = parseFloat(texture[j])
            }
            all_textures.push(texture);
        } else if (line.startsWith("vn ")){ // This is a normal vector
            normal = line.replace("vn ", "");
            normal = normal.split(" ");
            for (var j = 0; j < normal.length; j++){
                normal[j] = parseFloat(normal[j])
            }
            all_normals.push(normal);
        } else if (line.startsWith("f ")){ // This is a face, giving pairs of v/vt/vn for each vertex of the face.
            face = line.replace("f ", "")
            face = face.split(" ")
            var vertex_indices = [];
            var texture_indices = [];
            var normal_indices = [];
            for (var j =0; j < face.length; j++ ) {
                vertex = face[j].split("/")
                vertex_indices.push(parseInt(vertex[0]));
                texture_indices.push(parseInt(vertex[1]));
                normal_indices.push(parseInt(vertex[2]));
            }
            faces.push({vertex: vertex_indices, texture: texture_indices, normal: normal_indices})
        }
        else if (line.startsWith("s ")) { // smooth shading flag
            smoothShading = line.replace("s ", "");
        }
    }

    // add the last objet
    if (name !== null ) { // Adding to the model
        model = {
            name: name,
            faces: faces,
            smoothShading: smoothShading
        }
        models.push(model);
    }

    models.all_vertices = all_vertices;
    models.all_textures = all_textures;
    models.all_normals = all_normals;


    // Convert flat shading models to smooth shading, by duplicating vertices per face.
    var index_list = [];
    for (var i = 0; i < models.length; i++){
        model = models[i]
        for (var j = 0; j < model.faces.length; j++){
            var v = model.faces[j].vertex;
            var n = model.faces[j].normal;
            for (var k = 0; k < v.length; k++){
                let index = [v[k], n[k]];
                let foo = index_list.findIndex(e => (e[0] === index[0] && e[1] === index[1]));
                if (foo === -1){ // Not found, adding to the list
                    index_list.push(index)
                }
            }
        }
    }

    // Adding missing vertices and normals
    let new_vertices = [];
    let new_normals = [];

    for (var j=0; j < index_list.length; j++){
        new_vertices.push(models.all_vertices[index_list[j][0]-1])
        new_normals.push(models.all_normals[index_list[j][1]-1])
    }

    // Generating new faces ids
    var new_models = [];
    for (var i =0; i < models.length; i++) {
        let new_faces = [];
        model = models[i];
        for (var j = 0; j < model.faces.length; j++) {
            let vertex = model.faces[j].vertex;
            let normal = model.faces[j].normal;
            let new_vertex = []
            let new_normal = []
            for (var k = 0; k < vertex.length; k++) {
                index = [vertex[k], normal[k]];
                foo = index_list.findIndex(e => (e[0] === index[0] && e[1] === index[1]));
                new_vertex.push(foo + 1)
                new_normal.push(foo + 1)
            }
            new_faces.push({vertex: new_vertex, normal: new_normal})
        }
        model.faces = new_faces;
        new_models.push(model);
    }
    new_models.all_vertices = new_vertices;
    new_models.all_normals = new_normals;

    // Convert models to IFS

    // Create vertex position array
    vertexPositions = [];
    for (var i = 0; i < new_models.all_vertices.length; i++){
        vertexPositions.push(...new_models.all_vertices[i])
    }

    // Create normal position array
    vertexNormals = [];
    for (var i = 0; i < new_models.all_normals.length; i++){
        vertexNormals.push(...new_models.all_normals[i])
    }

    // Create parts indices list
    parts = {};
    for (var i = 0; i < new_models.length; i++) {
        model = new_models[i];
        face_list = []
        for (var j = 0; j < model.faces.length; j++){
            vertex = model.faces[j].vertex;
            for (var k = 0; k < vertex.length; k++){
                vertex[k] = vertex[k] - 1;
            }
            face_list.push(...vertex)
        }
        parts[model.name] = face_list;
    }

    modelsIFS = {vertexPositions: vertexPositions,
        vertexNormals: vertexNormals,
        parts: parts}
    return modelsIFS;
}