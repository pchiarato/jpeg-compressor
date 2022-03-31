let dropArea = document.getElementById('drop-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults (e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight');
}

function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const input = document.querySelector('input');
  let dt = e.dataTransfer;
  let files = dt.files;
  input.files = files;
  handleFiles(files);
}

function handleFiles(files) {
  uploadFile(files);
  updateImageDisplay();
}
function uploadFile(files) {
  let url = 'http://localhost:3000/upload';
  let formData = new FormData();
  Object.values(files).forEach(file => formData.append('file', file));
  fetch(url, {
    method: 'POST',
    body: formData
  })
  .then(() => {
    // Add logic to enable compression button
    console.log('DONE');
  })
  .catch(() => console.error('ERROR'))
}
async function downloadCompressedImages() {
  let url = 'http://localhost:3000/download';
  fetch(url, {
    method: 'GET',
  })
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "compressedImages.zip";
    document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
    a.click();    
    a.remove();  //afterwards we remove the element again  
  })
  .catch(() => console.error('ERROR'))
}

function returnFileSize(number) {
  if(number < 1024) {
    return number + 'bytes';
  } else if(number >= 1024 && number < 1048576) {
    return (number/1024).toFixed(1) + 'KB';
  } else if(number >= 1048576) {
    return (number/1048576).toFixed(1) + 'MB';
  }
}
function updateImageDisplay() {
  const input = document.querySelector('input');
  const preview = document.querySelector('.preview');
  while(preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }

  const curFiles = input.files;
  if(curFiles.length === 0) {
    const para = document.createElement('p');
    para.textContent = 'No files currently selected for upload';
    preview.appendChild(para);
  } else {
    const list = document.createElement('ol');
    preview.appendChild(list);

    for(const file of curFiles) {
      const listItem = document.createElement('li');
      const para = document.createElement('p');

      para.textContent = `${file.name}, size ${returnFileSize(file.size)}.`;
      const image = document.createElement('img');
      image.src = URL.createObjectURL(file);

      listItem.appendChild(image);
      listItem.appendChild(para);
      // if(validFileType(file)) {
      //   para.textContent = `File name ${file.name}, file size ${returnFileSize(file.size)}.`;
      //   const image = document.createElement('img');
      //   image.src = URL.createObjectURL(file);

      //   listItem.appendChild(image);
      //   listItem.appendChild(para);
      // } else {
      //   para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
      //   listItem.appendChild(para);
      // }

      list.appendChild(listItem);
    }
  }
}

