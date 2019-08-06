var stationName
var trainsNum
// var
function ajaxQuery() {
  // u = 'https://api.giphy.com/v1/gifs/search?q=' + searchVal + '&api_key=ughKaFh6kz4IdmoxQrJ06Q7U7090yfYM&limit=' + maxResult;
  u =
    'https://api.bart.gov/api/etd.aspx?cmd=etd&orig=EMBR&key=QVM2-5EIY-9Q9T-DWE9&json=y'
  console.log('====>' + u)
  $.ajax({
    url: u,
    method: 'GET'
  }).then(function(response) {
    $('#Platform1').empty()
    $('#Platform2').empty()
    // debugger
    console.log('======>' + response)
    stationName = response.root.station[0].name
    $('#stationName').text(stationName)
    trainsNum = response.root.station[0].etd.length
    console.log('number of destinations = ' + trainsNum)
    for (var i = 0; i < trainsNum; i++) {
      var dest = response.root.station[0].etd[i].destination
      var etas = response.root.station[0].etd[i].estimate.length
      console.log('destinations == > ' + dest)
      // debugger
      var min = []
      var bartPlatform
      // console.log('platfrom = ' + bartPlatform)
      for (var e = 0; e < etas; e++) {
        min.push(response.root.station[0].etd[i].estimate[e].minutes)
        bartPlatform = response.root.station[0].etd[i].estimate[e].platform
      }
      console.log('platfrom = ' + bartPlatform)
      var divTag = $('<div>').text(dest)
      if (bartPlatform == 1) {
        $('#Platform1').append(divTag)
        $('#Platform1').append($('<p>').text(`Minutes:${min.join(',')}`))
      } else {
        $('#Platform2').append(divTag)
        $('#Platform2').append($('<p>').text(`Minutes:${min.join(',')}`))
      }
      // $('<div></div>').text('something...')
    }
    // $('#stationName').text(stationName)
    console.log('something')
  })
}

ajaxQuery()

setInterval(function() {
  ajaxQuery()
}, 3 * 1000)
