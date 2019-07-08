const fileInput = document.getElementById("fileInput");
const submitButton = document.getElementById("submitButton");
const getFileButton = document.getElementById("labelSubmitButton");
const imagePreview = document.getElementById("imagePreview");
const headerText = document.getElementById("headerText");
let submitLocked = false;

const compressOptions = {
    "1": document.getElementById("optionImageCompress1"),
    "2": document.getElementById("optionImageCompress2"),
    "3": document.getElementById("optionImageCompress3"),
    "4": document.getElementById("optionImageCompress4"),
};
const getCompressOptionsInnerHtml = (id, img) => {
    compressOptions[id].innerHTML = `<sup>1</sup>/<sub>${id}</sub> : ${img.width / id | 0}<sub>pX</sub> X ${img.height / id | 0}<sub>pX</sub>`;
};
const GetRadioNameValue = name => {
    let value = undefined;
    document.getElementsByName(name).forEach(r => {
        if (r.checked) value = r.value
    });
    return value;
};

fileInput.oninput = () => {
    submitLocked = false;
    getFileButton.innerText = "Get file";
    getFileButton.setAttribute("class", null);
    imagePreview.setAttribute("class", "img-border");

    let reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;

        let img = new Image();
        img.onload = () => {
            getCompressOptionsInnerHtml("1", img);
            getCompressOptionsInnerHtml("2", img);
            getCompressOptionsInnerHtml("3", img);
            getCompressOptionsInnerHtml("4", img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
};
submitButton.onclick = () => {
    if (!submitLocked) {
        if (!!fileInput.files[0]) {
            getFileButton.innerText = "Get file";
            getFileButton.setAttribute("class", null);
            getFileButton.innerText = "pRocessinG...";
            submitLocked = true;

            let formData = new FormData();
            formData.append('imgToPoster', fileInput.files[0]);
            formData.append('imageCompressing', GetRadioNameValue("imageCompressing"));
            formData.append('fontSize', GetRadioNameValue("fontSize"));

            fetch(
                window.origin + "/tip",
                {
                    method: "POST",
                    body: formData,
                })
                .then(res => {
                    return res.json();
                })
                .then(data => {
                    let parsedData = JSON.parse(data);
                    if (parsedData.invalidImage === false) {
                        submitLocked = false;
                        getFileButton.innerText = "Get file";
                        window.open(`${window.origin}/pdf/${parsedData.fileName}`, "_blank");
                    } else if (parsedData.oversize === true) {
                        getFileButton.innerText = "imaGe oversize";
                        getFileButton.setAttribute("class", "error");
                    } else {
                        getFileButton.innerText = "invAlid imaGe";
                        getFileButton.setAttribute("class", "error");
                    }
                })
        } else {
            getFileButton.innerText = "no file";
            getFileButton.setAttribute("class", "error");
        }
    }
};

let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
window.onscroll = () => {
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let s = (100 - scrollTop) / 100;
    headerText.style.opacity = `${s < 0.2 ? 0.2 : s}`;
};
window.onscroll();