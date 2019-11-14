function warningsToEl(id, value){
    if(id[0]+id[1]+id[2]+id[3] == "opt1"){
        let parent = document.getElementById('opt1');
        if(value >= 4){
            parent.style.borderStyle = 'solid';
            parent.style.borderColor = 'rgb(255,0,0)';
        }else{
            parent.style.borderStyle = 'none';
        }
    }
}

function setData(){
    let data = {
        floorNumber: parseFloat(document.getElementById("opt1Input").value),
        floorHeight: parseFloat(document.getElementById("opt2Input").value),
        wallThickness: parseFloat(document.getElementById("opt3Input").value),
        maxWindows: parseInt(document.getElementById("opt4Input").value),
    }
    dataFromUI(data);
}

function sendCommands(type, el){
    let id;
    if(el != null && el != undefined){
        let p = el.parentElement;
        let str = p.id;
        id = parseInt(str.slice(5, str.length));
        
        let childIcon = el.querySelector(".fas");
        if(childIcon.classList == "fas fa-eye-slash"){
            childIcon.classList = "fas fa-eye";
        }else{
            childIcon.classList = "fas fa-eye-slash";
        }
    }

    if(type == "diagram"){
        cmdFromUI(2, id);
    }else  if(type == "explode"){
         cmdFromUI(3,id);

       
    }
}


// function showContent(i){
//     let el = i.parentElement.parentElement;
   
//     let childShowIcon = el.querySelector(".floorShowIcon");
//     if(childShowIcon.classList == "floorShowIcon fas fa-arrow-alt-circle-down"){
//         childShowIcon.classList = "floorShowIcon fas fa-arrow-alt-circle-up";
//     }else{
//         childShowIcon.classList = "floorShowIcon fas fa-arrow-alt-circle-down";
//     }

//     let childContent = el.querySelector("#contentHide");
//     let childContentState = childContent.style.display;
//     if(childContentState == "block"){
//         childContent.style.display = "none";
//     }else{
//         childContent.style.display = "block";
//     }
    
// }