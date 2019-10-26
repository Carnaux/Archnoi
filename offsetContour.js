/*
    CODE BY prisoner849

    https://stackoverflow.com/questions/50957349/threejs-how-to-offset-all-points-on-a-2d-geometry-by-distance

    https://discourse.threejs.org/t/offsetcontour-function/3185?u=prisoner849

    http://jsfiddle.net/prisoner849/a2ef1v5g/
    
*/


function OffsetContour(offset, contour) {
  	
    let result = [];
    
    offset = new THREE.BufferAttribute(new Float32Array([offset, 0, 0]), 3);
    //console.log("offset", offset);
    
    for (let i = 0; i < contour.length; i++) {
      let v1 = new THREE.Vector2().subVectors(contour[i - 1 < 0 ? contour.length - 1 : i - 1], contour[i]);
      let v2 = new THREE.Vector2().subVectors(contour[i + 1 == contour.length ? 0 : i + 1], contour[i]);
      let angle = v2.angle() - v1.angle();
      let halfAngle = angle * 0.5;
			
      let hA = halfAngle;
      let tA = v2.angle() + Math.PI * 0.5;
      
      let shift = Math.tan(hA - Math.PI * 0.5);
      let shiftMatrix = new THREE.Matrix4().set(
             1, 0, 0, 0, 
        -shift, 1, 0, 0,
             0, 0, 1, 0,
             0, 0, 0, 1
      );
			
      
      let tempAngle = tA;
      let rotationMatrix = new THREE.Matrix4().set(
        Math.cos(tempAngle), -Math.sin(tempAngle), 0, 0,
        Math.sin(tempAngle),  Math.cos(tempAngle), 0, 0,
                          0,                    0, 1, 0,
                          0,                    0, 0, 1
      );

      let translationMatrix = new THREE.Matrix4().set(
        1, 0, 0, contour[i].x,
        0, 1, 0, contour[i].y,
        0, 0, 1, 0,
        0, 0, 0, 1,
      );

      let cloneOffset = offset.clone();
      //console.log("cloneOffset", cloneOffset);
   		shiftMatrix.applyToBufferAttribute(cloneOffset);
      rotationMatrix.applyToBufferAttribute(cloneOffset);
      translationMatrix.applyToBufferAttribute(cloneOffset);

      result.push(new THREE.Vector2(cloneOffset.getX(0), cloneOffset.getY(0)));
    }
    

    return result;
  }
