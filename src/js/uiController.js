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

function showContent(i){
    let el = i.parentElement.parentElement;
    // let el = p.parentElement;
    let childShowIcon = el.querySelector("#floorShowIcon");
    if(childShowIcon.classList == "iconFloorTitle fas fa-arrow-alt-circle-down"){
        childShowIcon.classList = "iconFloorTitle fas fa-arrow-alt-circle-up";
    }else{
        childShowIcon.classList = "iconFloorTitle fas fa-arrow-alt-circle-down";
    }

    let childContent = el.querySelector("#contentHide");
    let childContentState = childContent.style.display;
    if(childContentState == "block"){
        childContent.style.display = "none";
    }else{
        childContent.style.display = "block";
    }
    
}