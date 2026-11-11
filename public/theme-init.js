try {
  var t = localStorage.getItem('ngoding5:v1:theme');
  if (t === '"light"' || t === '"dark"') document.documentElement.setAttribute('data-theme', JSON.parse(t));
} catch (e) {}
