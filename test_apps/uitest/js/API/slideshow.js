// The image we want to view
var imageblob;

document.getElementById('open').onclick = function() {
  var a = new MozActivity({
    name: 'slideshow',
    data: {
      type: 'photos'
    }
  });

  a.onsuccess = function() {
    document.getElementById('result').textContent = this.result.text;
  };

  a.onerror = function() {
    alert('Failure open SlideShow');
    document.getElementById('result').textContent = '(canceled)';
  };
};
