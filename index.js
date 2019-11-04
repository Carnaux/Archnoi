var voronoi = new Voronoi();
var maxX = 200;
var maxY = 200;
var minX = 0;
var minY = 0;
var floorHeight = 5;

var bbox = {xl: minX, xr: maxX, yt: minY, yb: maxY};

var floors = [];

var floorNumber = 1;

var wallThickness = 0.5;

var csg = new CSG();

var scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(112,112,112)");
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
document.body.appendChild( renderer.domElement );

var light = new THREE.PointLight( 0xffffff, 1, 100 );
light.position.set( 0, (floorHeight*floorNumber) + 100, 0 );
light.castShadow = true; 
scene.add( light );

var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
scene.add( light );

var axesHelper = new THREE.AxesHelper( 2 );
scene.add( axesHelper );

camera.position.z = 200;
camera.position.y = 50;

var controls = new THREE.OrbitControls( camera, renderer.domElement );




buildingGeneration(floorNumber);

// drawLines();

var animate = function () {
    requestAnimationFrame( animate );
    controls.update();

    renderer.render( scene, camera );
};

animate();

function buildingGeneration(n){
    for(let nF = 0; nF < n; nF++){
    
        let pointArr = generatePoints(50);

        let diagram = voronoi.compute(pointArr, bbox);
        
        let randCell = getRandomCell(pointArr, diagram);
        let shapePoints = processNeighbours(randCell.neighbours, diagram);
        removeMainPoints(shapePoints, randCell);
        removeDuplicates(shapePoints);
        let M = findMiddle(shapePoints);
        let ordered = orderByPolar(shapePoints, M);
        console.log(ordered);
        let walls = processOrderedPoints(ordered);
        let outerWall = getOutPoints(ordered);
        let hole = createShapeByOrder(ordered);

        let floor = create3DFloor(hole, outerWall, randCell.bPos, nF, walls);
        scene.add(floor);
      
        // console.log("mesh", floor);


        // let obj = {
        //     pointArr: pointArr,
        //     diagram: diagram,
        //     cell: randCell,
        //     shapePoints: shapePoints,
        //     m: M,
        //     orderedPoints: ordered,
        //     shape: shape,
        //     mesh3D: mesh3DWrapper
        // }


        // floors.push(obj);
       
    }
}

function generatePoints(n){
    let points = [];
    for(let i = 0; i < n; i++){
        let pX = parseInt(Math.random() * maxX);
        let pY = parseInt(Math.random() * maxY);

        let obj = {
            x: pX,
            y: pY,
        }

        points.push(obj)
    }  
    return points; 
}

function getRandomCell(points, diagram){
    let randomIndex = parseInt(Math.random() * points.length + 1);
    
    let voroId = points[randomIndex].voronoiId;

    let cell = diagram.cells[voroId];

    let mainPoints = getMainPoints(cell);

    let pos = new THREE.Vector3( cell.site.x * -1, cell.site.y * -1 , 0);
    
    let neighbours = [];

    for(let i = 0; i < cell.halfedges.length; i++){
        let current = cell.halfedges[i].edge;

        if(current.lSite != null){
            if(current.lSite.voronoiId != voroId){
                neighbours.push(current.lSite.voronoiId);
            }
        }

        if(current.rSite != null){
            if( current.rSite.voronoiId != voroId){
                neighbours.push(current.rSite.voronoiId);
            }
        }
    }

    let obj = {
        id: voroId,
        cell: cell,
        bPos: pos,
        mainPoints: mainPoints,
        neighbours: neighbours
    };
    
    return obj;
}

function getMainPoints(cell){
    let mainPoints = [];
    let idArr = [];

    for(let i = 0; i < cell.halfedges.length; i++){

        let va = new THREE.Vector3( cell.halfedges[i].edge.va.x,  cell.halfedges[i].edge.va.y, 0 );
        let vb = new THREE.Vector3(  cell.halfedges[i].edge.vb.x,  cell.halfedges[i].edge.vb.y, 0 );

        mainPoints.push(va);
        mainPoints.push(vb);
    }
  
    for(let i = 0; i < mainPoints.length; i++){
        for(let j = 0; j < mainPoints.length; j++){
            if(i != j){
                if(mainPoints[i].equals(mainPoints[j])){
                    idArr.push(j);
                }
            }
        }
    }
    
    for(let i = 0; i < idArr.length; i++){
       idArr.splice(idArr[i], 1, -1 );
    }

    let obj = {
        points: mainPoints,
        idArr: idArr
    }

    return obj;
}

function processOrderedPoints(arr){
    let walls = [];
    let removePoints = [];
    
    for(let i = 0; i < arr.length; i++){
        let currentVector = arr[i].p;
        let aV1;
        let aV2;
        
       

        if(i == 0){
            aV1 = arr[arr.length - 1].p;

            // var dotGeometry = new THREE.Geometry();
            // dotGeometry.vertices.push(new THREE.Vector3(aV1.x, aV1.y,0));
            // var dotMaterial = new THREE.PointsMaterial({
            // size: 10,
            // sizeAttenuation: false,
            // color: new THREE.Color("rgb(255,0,0)")
            // });
            // var dot = new THREE.Points(dotGeometry, dotMaterial);
            // scene.add(dot);
        }else{
            aV1 = arr[i - 1].p;  
        }

        if(i == arr.length -1){
            aV2 = arr[0].p;
           
        }else{
            aV2 = arr[i + 1].p;  
        }

        if(i == 1){
            // var dotGeometry = new THREE.Geometry();
            // dotGeometry.vertices.push(new THREE.Vector3(aV1.x, aV1.y,0));
            // var dotMaterial = new THREE.PointsMaterial({
            // size: 10,
            // sizeAttenuation: false,
            // color: new THREE.Color("rgb(255,255,0)")
            // });
            // var dot = new THREE.Points(dotGeometry, dotMaterial);
            // scene.add(dot);
        }
        let l1 = new THREE.Vector2(currentVector.x - aV1.x, currentVector.y - aV1.y);
        let l2 = new THREE.Vector2(aV2.x - currentVector.x, aV2.y - currentVector.y);

        let angle = Math.acos((l1.dot(l2))/(l1.length() * l2.length()));
        let dg = THREE.Math.radToDeg(angle);

        

        if(dg > 110 && dg < 145 || dg > 0 && dg < 10){
            removePoints.push(i);
            // console.log("i", i, " ", dg);
            // var dotGeometry = new THREE.Geometry();
            // dotGeometry.vertices.push(new THREE.Vector3(currentVector.x, currentVector.y,0));
            // var dotMaterial = new THREE.PointsMaterial({
            // size: 10,
            // sizeAttenuation: false
            // });
            // var dot = new THREE.Points(dotGeometry, dotMaterial);
            // scene.add(dot);
        }

        
    }
    // console.log(removePoints)
    // for(let i = 0; i < removePoints.length; i++){
    //     arr.splice(removePoints[i],1);
    // }

    for(let i = 0; i < arr.length; i++){
        let wall = {
            va: new THREE.Vector2().copy(arr[i].p),
            vb: 0
        }

        if(i == arr.length - 1){
            wall.vb = new THREE.Vector2().copy(arr[0].p);
        }else{
            wall.vb = new THREE.Vector2().copy(arr[i + 1].p);
        }

        walls.push(wall);
    }
    

    return walls;
    // console.log(arr);
}

function processNeighbours(arr, diagram){
    let shapePoints = [];
    for(let i = 0; i < arr.length; i++){

        let cell = diagram.cells[arr[i]];

        for(let k = 0; k < cell.halfedges.length; k++){

            let va = new THREE.Vector3( cell.halfedges[k].edge.va.x,  cell.halfedges[k].edge.va.y, 0 );
            let vb = new THREE.Vector3(  cell.halfedges[k].edge.vb.x,  cell.halfedges[k].edge.vb.y, 0 );

            shapePoints.push(va);
            shapePoints.push(vb);
        }
    }
    return shapePoints;
}

function removeMainPoints(arr, cell){
    let idArr = cell.mainPoints.idArr;
    let mainPoints = cell.mainPoints.points;
    let tempIdArr = [];

    for(let i = 0; i < idArr.length; i++){
        let id = idArr[i];
        if( id != -1){
            for(let j = 0; j < arr.length; j++){
                if(mainPoints[id].equals(arr[j])){
                    tempIdArr.push(j);
                } 
            }
        }
    }

    for(let i = 0; i < tempIdArr.length; i++){
        arr.splice(tempIdArr[i], 1, -1 );
    }

    for(let i = 0; i < arr.length; i++){
        if(arr[i] == -1){
            arr.splice(i, 1);
            i--;
        }
    }

    // console.log("temp",tempIdArr);
    // console.log("shape", arr);
    
}

function removeDuplicates(arr){
    for(let i = 0; i < arr.length; i++){
        let p = arr[i];
        for(let k = 0; k < arr.length; k++){
            let p2 = arr[k];
            if(i != k){
                if(p.equals(p2)){
                    arr.splice(i, 1, -1);
                }
            }
            
        }
    }

    
    for(let i = 0; i < arr.length; i++){
        if(arr[i] == -1){
            arr.splice(i, 1);
            i--;
        }
    }
    // shapePoints = newArr;
}

function findMiddle(arr){
    let m = new THREE.Vector2();

    let sumX = 0;
    let sumY = 0;

    for(let i = 0; i < arr.length; i++){
        sumX += arr[i].x;
        sumY += arr[i].y;
    }

    m.x = sumX/arr.length;
    m.y = sumY/arr.length;

    return m;

}

function orderByPolar(arr, M){
    let aValues = [];

    for(let k = 0; k < arr.length; k++){
        let obj = {
            p: new THREE.Vector2(arr[k].x, arr[k].y),
            a: Math.atan2(arr[k].y - M.y, arr[k].x - M.x)
        }
        aValues.push(obj);
        
    }

    aValues.sort(function(a, b){return a.a - b.a});

    return aValues;
}

function createShapeByOrder(arr){
    var path = new THREE.Shape();
    path.moveTo( arr[0].p.x, arr[0].p.y );
    for(let k = 1; k < arr.length; k++){
        path.lineTo(arr[k].p.x, arr[k].p.y );
    }

    return path;
}

function drawLines(){
    for(let i = 0; i < diagram.edges.length; i++){
        var material = new THREE.LineBasicMaterial({
            color: 0x0000ff
        });
        
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( diagram.edges[i].va.x,  diagram.edges[i].va.y, 0 ),
            new THREE.Vector3( diagram.edges[i].vb.x,  diagram.edges[i].vb.y, 0 )
        );
        
        var line = new THREE.Line( geometry, material );
        scene.add( line );
    }
}

function getOutPoints(arr){
    let orderedArr = [];

    for(let i = 0; i < arr.length; i++){
        orderedArr.push(arr[i].p);
    }

    let outOffset = OffsetContour(-wallThickness, orderedArr);

    

    return outOffset;
}

function drawShapePoints(geo){
    let obj = geo.parameters.shapes.curves;
    let size = obj.length;
    
    for(let i = 0; i < size; i++){
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push( new THREE.Vector3(obj[i].v1.x, obj[i].v1.y, 2));
        var dotMaterial = new THREE.PointsMaterial({
        size: 10,
        sizeAttenuation: false,
        color: new THREE.Color("rgb(255,0,0)")
        });
        var dot = new THREE.Points(dotGeometry, dotMaterial);
        scene.add(dot);

        var dotGeometry2 = new THREE.Geometry();
        dotGeometry2.vertices.push(new THREE.Vector3(obj[i].v2.x, obj[i].v2.y, 2));
        var dotMaterial2 = new THREE.PointsMaterial({
        size: 10,
        sizeAttenuation: false,
        color: new THREE.Color("rgb(255,0,0)")
        });
        var dot2 = new THREE.Points(dotGeometry2, dotMaterial2);
        scene.add(dot2);
    }
   
}

function create3DFloor(hole, outerWall, pos, nF, walls){
    var shape = new THREE.Shape(outerWall);
        shape.holes.push(hole); 

    var floorShape = new THREE.Shape(outerWall);
    var ceilingShape = new THREE.Shape(outerWall);

    var geometry = new THREE.ShapeGeometry( floorShape );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );
    let floorCeilingThickness = 0.1;

    var extrudeSettingsCeiling = { depth: floorCeilingThickness, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    var extrudedGeoCeiling = new THREE.ExtrudeGeometry( ceilingShape, extrudeSettingsCeiling );
    var meshCeiling = new THREE.Mesh(extrudedGeoCeiling, new THREE.MeshStandardMaterial({color: new THREE.Color("rgb(205,192,176)"), metalness: 0, roughness: 0.8}) );
    meshCeiling.castShadow = true;
    meshCeiling.receiveShadow = true; 
    meshCeiling.name = "meshCeiling";
    meshCeiling.position.copy(pos);
    meshCeiling.position.z = meshCeiling.position.z;

    var extrudeSettingsFloor = { depth: floorCeilingThickness, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    var extrudedGeoFloor = new THREE.ExtrudeGeometry( floorShape, extrudeSettingsFloor );
    var meshFloor = new THREE.Mesh(extrudedGeoFloor, new THREE.MeshStandardMaterial({color: new THREE.Color("rgb(205,192,176)"), metalness: 0, roughness: 0.8}) );
    meshFloor.castShadow = true;
    meshFloor.receiveShadow = true; 
    meshFloor.name = "meshFloor";
    meshFloor.position.copy(pos);
    meshFloor.position.z = meshFloor.position.z + (floorHeight);
    
    var extrudeSettings = { depth: floorHeight, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    var extrudedGeo = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    var meshWalls = new THREE.Mesh(extrudedGeo, new THREE.MeshStandardMaterial({color: new THREE.Color("rgb(205,192,176)"), metalness: 0, roughness: 0.8}) );
    meshWalls.castShadow = true;
    meshWalls.receiveShadow = true;
    meshWalls.name = "meshWalls"; 
    meshWalls.position.copy(pos);

    var meshWallsWithout = new THREE.Mesh(extrudedGeo, new THREE.MeshStandardMaterial({color: new THREE.Color("rgb(205,192,176)"), metalness: 0, roughness: 0.8}) );
    meshWallsWithout.castShadow = true;
    meshWallsWithout.receiveShadow = true;
    meshWallsWithout.name = "meshWalls2"; 
    meshWallsWithout.position.copy(pos);

   

    let mesh3DWrapper = new THREE.Object3D();
    if(nF == 0){
        createWinWall(mesh3DWrapper, meshWalls, meshCeiling, walls);
    }
    
    mesh3DWrapper.add(meshWalls);
    // mesh3DWrapper.add(meshWallsWithout);
    mesh3DWrapper.add(meshFloor);
    mesh3DWrapper.add(meshCeiling);
    mesh3DWrapper.position.y = (floorHeight * nF);
    mesh3DWrapper.rotation.x = Math.PI/2;
    

   

    return mesh3DWrapper;
}

function createWinWall(wrapper, mesh, mesh2, walls){
    var geometry = new THREE.BoxGeometry( 2, 0.7, 3 );
    // var geometry = new THREE.BoxGeometry( 5, 5, 5 );
    var material = new THREE.MeshBasicMaterial( { color: new THREE.Color("rgb(112,0,0)") } );
    var cube = new THREE.Mesh( geometry, material );
    //cube.rotation.x = -Math.PI/2;

    let wallWithDoor = parseInt(Math.random() * (walls.length-1));
    
    let w = walls[wallWithDoor];
    
    let normal = new THREE.Vector3( - ( w.vb.y - w.va.y), ( w.vb.x - w.va.x), 0);
    
    let r = Math.random();
    let x = r * w.vb.x + (1 - r) * w.va.x;
    let y = r * w.vb.y + (1 - r) * w.va.y;

    cube.lookAt( normal);

    let p = new THREE.Vector3(x, y, 0);

    cube.position.copy(p);
    
    mesh.add(cube);
    
   
    // var meshA = new THREE.Mesh(new THREE.BoxGeometry(10,10,10), material);
    // var meshB = new THREE.Mesh(new THREE.SphereGeometry( 5, 32, 32 ));
    // meshB.position.add(new THREE.Vector3( 10,10,10));
    // meshA.position.add(new THREE.Vector3( 2, 5, 5));
    // meshA.updateMatrix();
    // meshB.updateMatrix();
    // var meshC = doCSG( meshA, meshB, 'subtract', mesh.material);
    // scene.add(meshC);


    mesh2.updateMatrix();
    cube.updateMatrix();
    var meshC = doCSG( mesh2, cube, 'subtract', mesh.material);
    scene.add(meshC)

    // wrapper.remove(mesh);
    // // scene.remove(mesh)
    // wrapper.add(meshC)
    // mesh = meshC;

}

function doCSG(a,b,op,mat){
    var bspA = csg.fromMesh( a );
    var bspB = csg.fromMesh( b );
    var bspC = bspA[op]( bspB );
    var result = csg.toMesh( bspC, a.matrix );
    result.material = mat;
    result.castShadow  = result.receiveShadow = true;
    return result;
}
