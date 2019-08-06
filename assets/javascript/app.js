// // Initial array of movies
// var topics = ['elephants', 'dogs', 'cats', 'birds', 'lion'];

// // Function for displaying movie data
// function renderButtons() {
//   $('#imgResult').empty();
//   // Deleting the movie buttons prior to adding new movie buttons
//   // (this is necessary otherwise we will have repeat buttons)
//   $("#buttons-view").empty();

//   // Looping through the array of movies
//   for (var i = 0; i < topics.length; i++) {

//     // Then dynamicaly generating buttons for each movie in the array.
//     // This code $("<button>") is all jQuery needs to create the start and end tag. (<button></button>)
//     var a = $("<button>");
//     // Adding a class
//     a.addClass("btn btn-light jLNpIz");

//     a.attr("type", "button");
//     // Adding a data-attribute with a value of the movie at index i
//     a.attr("data-name", topics[i]);
//     // Providing the button's text with a value of the movie at index i
//     a.text(topics[i]);
//     // Adding the button to the HTML
//     $("#buttons-view").append(a);
//   }
// }

// // This function handles events where one button is clicked
// $('form[name=searchGIF]').on('submit', function (event) {

//   // event.preventDefault() prevents the form from trying to submit itself.
//   // We're using a form so that the user can hit enter instead of clicking the button if they want

//   // This line will grab the text from the input box
//   var topic = $('input[name=gifInput').val().trim();
//   console.log('topic ===> ' + topic)
//   //   alert(topic);

//   //   var movie = $("#movie-input").val().trim();
//   // The movie from the textbox is then added to our array
//   topics.push(topic);

//   // calling renderButtons which handles the processing of our movie array
//   renderButtons();
//   $('input[name=gifInput').val('');
//   debugger;
//   ajaxQuery(topic, 10);
//   debugger;
//   event.preventDefault();
// });

// // Calling the renderButtons function at least once to display the initial list of topics
// renderButtons();

// // example
// // var xhr = $.get("http://api.giphy.com/v1/gifs/search?q=ryan+gosling&api_key=YOUR_API_KEY&limit=5");
// // xhr.done(function(data) { console.log("success got data", data); });

// $(document).on('click', 'button', function () {
//   var search_term = $(this).text().trim();
//   console.log('search_term ==>' + search_term);
//   var max_results = 10;
//   if (search_term != 'Search') ajaxQuery(search_term, max_results);

// });
var stationName
var trainsNum
// var
function ajaxQuery() {
  // u = 'https://api.giphy.com/v1/gifs/search?q=' + searchVal + '&api_key=ughKaFh6kz4IdmoxQrJ06Q7U7090yfYM&limit=' + maxResult;
  u =
    'http://api.bart.gov/api/etd.aspx?cmd=etd&orig=EMBR&key=QVM2-5EIY-9Q9T-DWE9&json=y'
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
// $(document).on('click', ".gif", function () {
//   // The attr jQuery method allows us to get or set the value of any attribute on our HTML element
//   var state = $(this).attr("data-state");
//   // If the clicked image's state is still, update its src attribute to what its data-animate value is.
//   // Then, set the image's data-state to animate
//   // Else set src to the data-still value
//   if (state === "still") {
//     $(this).attr("src", $(this).attr("data-animate"));
//     $(this).attr("data-state", "animate");
//   } else {
//     $(this).attr("src", $(this).attr("data-still"));
//     $(this).attr("data-state", "still");
//   }
// });
