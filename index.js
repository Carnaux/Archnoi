var points = [];
var neighbours = [];
var mainPoints = [];
var maxX = 200;
var maxY = 200;
var minX = 0;
var minY = 0;
var voronoi = new Voronoi();
var bbox = {xl: minX, xr: maxX, yt: minY, yb: maxY};
var shapePoints = [];
var idArr = [];


var scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(255,255,255)");
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var axesHelper = new THREE.AxesHelper( 2 );
scene.add( axesHelper );

camera.position.z = 200;
camera.position.y = 50;

var controls = new THREE.OrbitControls( camera, renderer.domElement );

generatePoints(100);

var diagram = voronoi.compute(points, bbox);
// console.log(points);
// console.log(diagram);

getRandomCell();
drawNeighbours(neighbours, 1);
removeMainPoints();
 removeDuplicates();
let M = findMiddle(shapePoints);
let ordered = orderByPolar(shapePoints, M);
let shape = createShapeByOrder(ordered);

var extrudeSettings = { depth: 10, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial() );
scene.add(mesh);

// drawLines();

var animate = function () {
    requestAnimationFrame( animate );
    controls.update();

    renderer.render( scene, camera );
};

animate();


function generatePoints(n){
    for(let i = 0; i < n; i++){
        let pX = parseInt(Math.random() * maxX);
        let pY = parseInt(Math.random() * maxY);

        let obj = {
            x: pX,
            y: pY,
            
        }

        points.push(obj)
    }   
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

function getRandomCell(){
    let randomIndex = parseInt(Math.random() * points.length + 1);
    
    let voroId = points[randomIndex].voronoiId;

    let cell = diagram.cells[voroId];

    getMainPoints(cell);

    var dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(new THREE.Vector3(cell.site.x, cell.site.y,0));
    var dotMaterial = new THREE.PointsMaterial({
    size: 10,
    sizeAttenuation: false,
    color: new THREE.Color("rgb(255,0,0)")
    });
    var dot = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dot);

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
    // neighbours.push(voroId);
    
}

function getMainPoints(cell){
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

}

function removeMainPoints(){
    let newArr = [];
    let tempIdArr = [];

    for(let i = 0; i < idArr.length; i++){
        let id = idArr[i];
        if( id != -1){
            for(let j = 0; j < shapePoints.length; j++){
                if(mainPoints[id].equals(shapePoints[j])){
                    tempIdArr.push(j);
                } 
            }
        }
    }

    for(let i = 0; i < tempIdArr.length; i++){
        shapePoints.splice(tempIdArr[i], 1, -1 );
    }

    for(let i = 0; i < shapePoints.length; i++){
        if(shapePoints[i] == -1){
            shapePoints.splice(i, 1);
            i--;
        }
    }

    console.log("temp",tempIdArr);
    console.log("shape", shapePoints);
    // shapePoints = newArr;
}

function removeDuplicates(){
    let newArr = [];

    for(let i = 0; i < shapePoints.length; i++){
        let p = shapePoints[i];
        for(let k = 0; k < shapePoints.length; k++){
            let p2 = shapePoints[k];
            if(i != k){
                if(p.equals(p2)){
                    shapePoints.splice(i, 1, -1);
                }
            }
            
        }
    }

    
    for(let i = 0; i < shapePoints.length; i++){
        if(shapePoints[i] == -1){
            shapePoints.splice(i, 1);
            i--;
        }
    }
    // shapePoints = newArr;
}

function drawNeighbours(arr, n){
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