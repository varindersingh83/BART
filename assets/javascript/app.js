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
      var divTag = $('<div>').text(dest)
      $('#destinations').append(divTag)
      for (var e = 0; e < etas; e++) {
        var min = response.root.station[0].etd[i].estimate[e].minutes
        var platform = response.root.station[0].etd[i].estimate[e].platform
        $('#destinations').append(
          $('<p>').text(`Minutes:${min}    Platform:${platform} `)
        )
      }
      // $('<div></div>').text('something...')
    }
    // $('#stationName').text(stationName)
    console.log('something')
  })
}
ajaxQuery()
