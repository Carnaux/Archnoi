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

var maxWindows = 3;

var groundOffset = 30;

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

var animate = function () {
    requestAnimationFrame( animate );
    controls.update();

    renderer.render( scene, camera );
};

animate();

function buildingGeneration(n){
    let buildingWrapper = new THREE.Object3D();
    for(let nF = 0; nF < n; nF++){
    
        let pointArr = generatePoints(50);

        let diagram = voronoi.compute(pointArr, bbox);
        
        let randCell = getRandomCell(pointArr, diagram);
        let shapePoints = processNeighbours(randCell.neighbours, diagram);
        removeMainPoints(shapePoints, randCell);
        removeDuplicates(shapePoints);
        let M = findMiddle(shapePoints);
        let ordered = orderByPolar(shapePoints, M);
        let walls = processOrderedPoints(ordered);
        let outerWall = getOutPoints(ordered);
        let hole = createShapeByOrder(ordered);

        let floor = create3DFloor(hole, outerWall, randCell.bPos, nF, walls);
        
        let floorArea = getPolygonArea(outerWall);

        let obj = {
            pointArr: pointArr,
            diagram: diagram,
            cell: randCell,
            shapePoints: shapePoints,
            m: M,
            orderedPoints: ordered,
            outPoints: outerWall,
            box3: {
                box: new THREE.Box3().setFromPoints(outerWall),
                arr: [],
                area: 0
            },
            shape: new THREE.Shape(outerWall),
            shapeArea: floorArea,
            mesh3D: floor
        };

        floors.push(obj);
        buildingWrapper.add(floor);
    }

    getBox3Data(floors);
    let biggestBox3 = getBiggestBox3(floors);

    
    if(floors.length < 4){
        for(let i = 0; i < floors.length; i++){

            let construtableArea = getAvaliableArea(floors[i], i, buildingWrapper, biggestBox3);
        

        }    
    }
    


    scene.add(buildingWrapper);
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
    
    let pointsArr = points[randomIndex];
    let voroId;
    if(pointsArr == undefined || pointsArr == null){
        location.reload();
    }else{
        voroId = pointsArr.voronoiId;
    }
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

    let mesh3DWrapper = new THREE.Object3D();
    
    createWinWall(mesh3DWrapper, meshWalls, walls, pos, nF);
    
    mesh3DWrapper.add(meshFloor);
    mesh3DWrapper.add(meshFloor);
    mesh3DWrapper.add(meshCeiling);
    mesh3DWrapper.position.y = (floorHeight * nF);
    mesh3DWrapper.rotation.x = Math.PI/2;
    
    return mesh3DWrapper;
}

function createWinWall(wrapper, mesh, walls, pos, nF){
    let wallMesh = mesh;
    let wallsWithDoor = [];
    if(nF == 0){
        //create doors at least 2
        for(let i= 0; i < 2; i++){
            var geometry = new THREE.BoxGeometry( 2, 1.6, 2 );
            var material = new THREE.MeshBasicMaterial( { color: new THREE.Color("rgb(112,0,0)") } );
            var cube = new THREE.Mesh( geometry, material );

            let wallWithDoor = parseInt(Math.random() * (walls.length-1));
            
            let w = walls[wallWithDoor];
            wallsWithDoor.push(wallWithDoor);
            let objPN = findPointAndNormal(w);
            
            cube.lookAt( objPN.normal);

            let p = new THREE.Vector3(objPN.x, objPN.y, floorHeight -1);

            cube.position.copy(p);

            wallMesh.updateMatrix();
            cube.updateMatrix();
            var meshC = doCSG( wallMesh, cube, 'subtract', mesh.material);
            wallMesh = meshC;
        }
    }
   

    let winQuantity = parseInt(Math.random() * maxWindows) + 1;

    for(let i = 0; i < winQuantity; i++){
        let wallWithWindow = parseInt(Math.random() * (walls.length-1));
        let found = null;
        for(let j= 0; j <  wallsWithDoor.length; j++){
            if(wallsWithDoor[j] == wallWithWindow){
                found = j;
            }
        }

        if(found == null){
            let w = walls[wallWithWindow];
            let objPN = findPointAndNormal(w, 0.5);

            var geometry = new THREE.BoxGeometry( floorHeight, objPN.length, 2 );
            var material = new THREE.MeshBasicMaterial( { color: new THREE.Color("rgb(112,0,0)") } );
            var cube = new THREE.Mesh( geometry, material );

            cube.lookAt( objPN.normal);

            let p = new THREE.Vector3(objPN.x, objPN.y, 3);

            cube.position.copy(p);

            wallMesh.updateMatrix();
            cube.updateMatrix();
            var meshC = doCSG( wallMesh, cube, 'subtract', mesh.material);
            wallMesh = meshC;
        }


    }




    wallMesh.position.copy(pos);
    wrapper.add( wallMesh );

}

function findPointAndNormal(w, R){
    let normal = new THREE.Vector3( - ( w.vb.y - w.va.y), ( w.vb.x - w.va.x), 0);
    let r = Math.random();
    if(R != undefined){
        r = R;
    }
    let l = Math.sqrt(Math.pow(w.vb.x - w.va.x, 2) + Math.pow(w.vb.y - w.va.y, 2)) 
    let x = r * w.vb.x + (1 - r) * w.va.x;
    let y = r * w.vb.y + (1 - r) * w.va.y;
    return {
        normal: normal,
        x: x,
        y: y,
        length: l
    };
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

function getPolygonArea(arr){
    let area = 0;         
    let j = arr.length-1; 

    for(i = 0; i < arr.length; i++){ 
        area = area + ( arr[j].x - arr[i].x) * ((arr[j].y + arr[i].y)/2); 
        j = i;  
    }

    return Math.abs(area);
}

function getBox3Data(floors){
    for(let i = 0; i < floors.length; i++){
        let box = floors[i].box3.box;

        let xMin = box.min.x - groundOffset;
        let xMax = box.max.x + groundOffset;
        let yMin = box.min.y - groundOffset;
        let yMax = box.max.y + groundOffset;

        let g1 = new THREE.Vector2(xMin, yMin);
        let g2 = new THREE.Vector2(xMin, yMax);
        let g3 = new THREE.Vector2(xMax, yMax);
        let g4 = new THREE.Vector2(xMax, yMin);

        let groundPoints = [g1, g2, g3, g4];
        floors[i].box3.arr = groundPoints;

        floors[i].box3.area = getPolygonArea(groundPoints);
    }
}

function getBiggestBox3(floors){
    let objs = [];
    for(let i = 0; i < floors.length; i++){
        let obj = {
            i: i,
            a: floors[i].box3.area
        }
        objs.push(obj);
    }

    objs.sort(function(a, b){return a.a - b.a});

    return objs[0];
}

function getAvaliableArea(floor, i, building, box){

    
    if(i == 0){
        

        let groundShape = new THREE.Shape( floors[box.i].box3.arr);
        // groundShape.position.copy(floor.cell.bPos)
        groundShape.holes.push(floor.shape);


        let groundExtrudeSettings = { depth: 0.01, bevelEnabled: false};
        let groundGeo = new THREE.ExtrudeGeometry( groundShape, groundExtrudeSettings );
        let meshGround = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({color: new THREE.Color("rgb(205,192,176)"), metalness: 0, roughness: 0.8}) );
        scene.add(meshGround)
        // let floorExtrudeSettings = { depth: 0.01, bevelEnabled: false};
        // let floorGeo = new THREE.ExtrudeGeometry( floorShape, floorExtrudeSettings );
        // let meshAvailGround = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({color: new THREE.Color("rgb(205,192,176)"), metalness: 0, roughness: 0.8}) );


    }
}