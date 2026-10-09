import { PerspectiveCamera,Vector3 } from 'three';
for(const [width,height] of [[320,844],[390,844],[768,900],[1440,900],[1920,900]]){
 const aspect=width/height,fov=2*Math.atan(Math.tan(Math.PI/6)/Math.min(1,aspect))*180/Math.PI;
 const camera=new PerspectiveCamera(fov,aspect,.1,400); camera.position.set(2,5,-110);camera.lookAt(-64*Math.min(1,.54*Math.max(1,aspect)),-42,-200);camera.updateMatrixWorld();
 const center=new Vector3(0,0,-200).project(camera); console.log(width,[(center.x+1)*width/2,(1-center.y)*height/2]);
}
