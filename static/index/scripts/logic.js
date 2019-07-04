const fileInput = document.getElementById("fileInput");
const submitButton = document.getElementById("submitButton");
const getFileButton = document.getElementById("labelSubmitButton");
const imagePreview = document.getElementById("imagePreview");

const compressOptions = {
   "1": document.getElementById("optionImageCompress1"),
   "2": document.getElementById("optionImageCompress2"),
   "3": document.getElementById("optionImageCompress3"),
   "4": document.getElementById("optionImageCompress4"),
};

const getCompressOptionsInnerHtml = (id, img) => {
   compressOptions[id].innerHTML = `<sup>1</sup>/<sub>${id}</sub> : ${img.width / id | 0}<sub>pX</sub> X ${img.height / id | 0}<sub>pX</sub>`;
};

fileInput.oninput = () => {
   getFileButton.innerText = "Get file";
   getFileButton.setAttribute("class", null);
   imagePreview.setAttribute("class", "img-border");

   let reader = new FileReader();
   reader.onload = (e) => {
      imagePreview.src = e.target.result;

      let img = new Image();
      img.onload = () => {
         console.log(img.width + 'x' + img.height);
         getCompressOptionsInnerHtml("1", img);
         getCompressOptionsInnerHtml("2", img);
         getCompressOptionsInnerHtml("3", img);
         getCompressOptionsInnerHtml("4", img);
      };
      img.src = e.target.result;
   };
   reader.readAsDataURL(fileInput.files[0]);
};

let submitLocked = false;

const GetRadioNameValue = name => {
   let value = undefined;
   document.getElementsByName(name).forEach(r => {
      if (r.checked) value = r.value
   });
   return value;
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
               return res.json()
            })
            .then(data => {
               getFileButton.innerText = "Get file";
               submitLocked = false;
               window.open(`${window.origin}/pdf/${JSON.parse(data).fileName}`, "_blank");
            });
      } else {
         getFileButton.innerText = "no file";
         getFileButton.setAttribute("class", "error");
      }
   }
};