let i = 1;
function change(){
    if(i > 2){
        i = 1;
    }else{
        i++;
    }
    let el = document.getElementById("imgLogo");
    el.src = "src/imgs/logo" + i + ".svg";
}

window.onload = setInterval(change, 2000);