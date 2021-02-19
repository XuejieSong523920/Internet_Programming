// here is the map function
      let map;
      let markers = [];
      function myMap(){
      var Center = new google.maps.LatLng (44.9727, -93.23540000000003);
            var mapProp = {
    center: Center,
    zoom:14,
    }
    map = new google.maps.Map(document.getElementById("map"), mapProp);
    const geocoder = new google.maps.Geocoder();
    //put custome markers on the map
    var allRows = document.getElementsByClassName("hidden");
        var i;
        var regex = /\d/g;
        for(i = 0; i < allRows.length; i++){
        var address = allRows[i].cells[3].childNodes[1].innerHTML;
        //id address contains number:
        if(regex.test(address)){
        var event = allRows[i].cells[1].innerHTML;
        var day = allRows[i].cells[0].innerHTML;
        var time = allRows[i].cells[2].innerHTML;
        var text = '';
        text += event + '<br/>' + day + ", " + time + '<br/>' + address;
        geocodeAddress(geocoder, map, address, text);
        }
        }
       
        // for search locations
        let input;
        var place = document.getElementById("place");
            if(place.value === "other"){
            document.getElementById("other").disabled = false;
            input = document.getElementById("other");
            } else{
            input = place;
            }
            console.log(input.value);
            var radius = document.getElementById("radius");
            console.log(radius.value);
            const searchLocation = function(){
            search(map, input.value, radius.value, Center);
            }
            document.getElementById("goSearch").addEventListener("click", searchLocation);

            //for the route to destinations
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
            draggable: true,
       map,
       panel: document.getElementById("left-panel"),

            });
            directionsRenderer.addListener("directions_changed", () => {
         computeTotalDistance(directionsRenderer.getDirections());
       });
           
            const onChangeHandler = function () {
         calculateAndDisplayRoute(directionsService, directionsRenderer);
       };        
            document.getElementById("findRoute").addEventListener("click", onChangeHandler);

}

        function geocodeAddress(geocoder, resultMap, address, infoContent){
        geocoder.geocode({address : address}, (results, status) => {
        if(status === "OK"){
        var marker = new google.maps.Marker({
        //map: resultMap,
           position: results[0].geometry.location,
           icon : 'gopher.png'
        });
        var infowindow = new google.maps.InfoWindow({
        content: infoContent
        });
        marker.addListener("click", () => {
        infowindow.open(resultMap,marker)
        });
        markers.push(marker);
        } else {
        alert("Geocode was not successful for the following reason: " + status);
        }
        });
        }
        function setMapOnAll(map){
        for (let i = 0; i < markers.length; i++) {
         markers[i].setMap(map);
       }
        }
        function clearMarkers() {
       setMapOnAll(null);
   }
   function showMarkers() {
        setMapOnAll(map);
   }


        function search(map, input, Radius, Center){
            var request = {
            location : Center,
            radius : Radius,
            query: input
            }
            service = new google.maps.places.PlacesService(map);
            clearMarkers();
            service.textSearch(request, callbackSearch);
        }
        function callbackSearch(results, status){
        if (status == google.maps.places.PlacesServiceStatus.OK) {
for (var i = 0; i < results.length; i++) {
 var place = results[i];
 createMarker(results[i]);
 }
}
}
function createMarker(place){
const marker = new google.maps.Marker({
         map,
         position: place.geometry.location,
       });
       let windowContent;
geocoder = new google.maps.Geocoder();

marker.addListener("click", () => {
geocoder.geocode({'location': place.geometry.location}, function(results, status){
     if (status === google.maps.GeocoderStatus.OK) {
       if (results[0]) {
                 windowContent = place.name + '<br/>' + results[0].formatted_address;
                 var infowindow = new google.maps.InfoWindow({
 content: windowContent,
 });
 infowindow.open(map,marker);
       } else {
         console.log('No results found');
       }
     } else {
       console.log('Geocoder failed due to: ' + status);
     }
   });
   
});
}

        function calculateAndDisplayRoute(directionsService, directionsRenderer) {
        const rbs = document.querySelectorAll('input[name="choice"]');
            let selectedValue = "WALKING";
            for (const rb of rbs) {
                if (rb.checked) {
                    selectedValue = rb.value;
                    break;
                }
            }
       if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function(p){
  var myLatLng = new google.maps.LatLng(p.coords.latitude, p.coords.longitude);
  directionsService.route(
         {
           origin: myLatLng,
           destination: {
             query: document.getElementById("dest").value,
           },
           travelMode: google.maps.TravelMode[selectedValue],
           avoidTolls: true,
         },
         (response, status) => {
           if (status === "OK") {
             directionsRenderer.setDirections(response);
           } else {
             window.alert("Directions request failed due to " + status);
           }
         }
         );
  });
}
      }

      function computeTotalDistance(result) {
        let total = 0;
        const myroute = result.routes[0];

        for (let i = 0; i < myroute.legs.length; i++) {
          total += myroute.legs[i].distance.value;
        }
        total = total / 1000;
        document.getElementById("total").innerHTML = total + " km";
      }
      window.addEventListener("load", showMarkers, false);
