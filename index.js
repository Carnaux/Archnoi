var voronoi = new Voronoi();
var maxX = 200;
var maxY = 200;
var minX = 0;
var minY = 0;
var floorHeight = 14;

var bbox = {xl: minX, xr: maxX, yt: minY, yb: maxY};

var floors = [];

var floorNumber = 1;

var wallThickness = 0.5

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

floorGeneration(floorNumber)

// drawLines();

var animate = function () {
    requestAnimationFrame( animate );
    controls.update();

    renderer.render( scene, camera );
};

animate();

function floorGeneration(n){
    for(let nF = 0; nF < n; nF++){
    
        let pointArr = generatePoints(50);

        let diagram = voronoi.compute(pointArr, bbox);
        
        let randCell = getRandomCell(pointArr, diagram);
        let shapePoints = processNeighbours(randCell.neighbours, diagram, 0);
        removeMainPoints(shapePoints, randCell);
        removeDuplicates(shapePoints);
        let M = findMiddle(shapePoints);
        let ordered = orderByPolar(shapePoints, M);
        let outerWall = getOutPoints(ordered);
        let hole = createShapeByOrder(ordered);
        
        var shape = new THREE.Shape(outerWall);
        var floorShape = new THREE.Shape(outerWall);
        var ceilingShape = new THREE.Shape(outerWall);
        shape.holes.push(hole); 

        var geometry = new THREE.ShapeGeometry( floorShape );
        var mesh2Dfloor = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({color: new THREE.Color("rgb(205,192,176)"), side: THREE.DoubleSide}) );
        
        mesh2Dfloor.position.copy(randCell.bPos);
        mesh2Dfloor.position.z = mesh2Dfloor.position.z + 15;
        scene.add(mesh2Dfloor);

        var geometry = new THREE.ShapeGeometry( shape );
        var mesh2D = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({color: new THREE.Color("rgb(205,192,176)"), side: THREE.DoubleSide}) );
        
        mesh2D.position.copy(randCell.bPos);
    
        var extrudeSettings = { depth: floorHeight, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        var extrudedGeo = new THREE.ExtrudeGeometry( shape, extrudeSettings );
        var mesh3D = new THREE.Mesh(extrudedGeo, new THREE.MeshStandardMaterial({color: new THREE.Color("rgb(205,192,176)"), metalness: 0, roughness: 0.8}) );
        mesh3D.castShadow = true;
        mesh3D.receiveShadow = false; 

        mesh3D.position.copy(randCell.bPos);
        // mesh3D.position.z =  mesh3D.position.z - 5;
        let mesh3DWrapper = new THREE.Object3D();
        mesh3DWrapper.add(mesh3D);
        mesh3DWrapper.add(mesh2Dfloor);
        mesh3DWrapper.position.y = (floorHeight * nF);
        
        mesh3DWrapper.rotation.x = Math.PI/2;

        // let obj = {
        //     pointArr: pointArr,
        //     diagram: diagram,
        //     shapePoints: shapePoints,
        //     m: M,
        //     orderedPoints: ordered,
        //     shape: shape,
        //     mesh2D: mesh2D,
        //     mesh3D: mesh3DWrapper
        // }

        // let geom = new THREE.BufferGeometry().setFromPoints(outerWall);
        // let line = new THREE.LineLoop(geom, new THREE.LineBasicMaterial({color: 0x777777 + Math.random() * 0x777777}));
        // line.position.copy(randCell.bPos);
        // scene.add(line);
                
        // floors.push(obj);
        //scene.add(mesh2D);
        scene.add(mesh3DWrapper);
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

function processNeighbours(arr, diagram, n){
    let shapePoints = [];
    for(let i = 0; i < arr.length; i++){

        let cell = diagram.cells[arr[i]];

        for(let k = 0; k < cell.halfedges.length; k++){

            let va = new THREE.Vector3( cell.halfedges[k].edge.va.x,  cell.halfedges[k].edge.va.y, 0 );
            let vb = new THREE.Vector3(  cell.halfedges[k].edge.vb.x,  cell.halfedges[k].edge.vb.y, 0 );

            shapePoints.push(va);
            shapePoints.push(vb);

            if(n == 1){
                var material = new THREE.LineBasicMaterial({
                    color: 0x0000ff
                });
                
                var geometry = new THREE.Geometry();
                geometry.vertices.push(
                    va,
                    vb
                );
                
                var line = new THREE.Line( geometry, material );
                scene.add( line );
            }
            
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

function createAntiClockPath(arr){

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

function reverseInternalPoints(arr){
    let antiClock = [];

    for(let i = arr.length-1; i > -1; i--){
        antiClock.push(arr[i]);
    }

    return antiClock;
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
