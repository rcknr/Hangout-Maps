function initialize() {

  var mapOptions = {
    center: new google.maps.LatLng(38.479395,27.158203),
    zoom: 3,
    minZoom: 2,
    maxZoom: 19,
    streetViewControl: false,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    },
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    panControl: false,
    zoomControl: true,
    zoomControlOptions: {
        style: google.maps.ZoomControlStyle.DEFAULT,
        position: google.maps.ControlPosition.LEFT_TOP
    },
    styles:
    [
      {
        featureType: "poi",
        elementType: "labels",
        stylers:
        [
          {
            visibility: "off"
          }
        ]
      }
    ]
  };

  map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

  // Initializing Drawing tools
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.MARKER,
        google.maps.drawing.OverlayType.CIRCLE,
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.POLYLINE,
        google.maps.drawing.OverlayType.RECTANGLE
      ]
    },
    markerOptions: {
      animation: google.maps.Animation.DROP,
      cursor: "crosshair", // Default option anyway
      draggable: true,
//      icon: 'images/beachflag.png',
      editable: true
    },
    circleOptions: {
      fillColor: '#ffff00',
      fillOpacity: 0.5,
      strokeWeight: 1,
      clickable: true,
      editable: false,
      zIndex: 1
    },
    polygonOptions: {
      fillColor: '#ffff00',
      fillOpacity: 0.5,
      strokeWeight: 1,
      clickable: true,
      editable: true
    }
  });
  drawingManager.setMap(map);

  google.maps.event.addListener(drawingManager, 'markercomplete', function(marker) {
      console.log('added some markers2');
      console.log(marker.getPosition().toString());
      gapi.hangout.data.submitDelta( {marker: marker.getPosition().toString()} );

   });

  map.controls[google.maps.ControlPosition.LEFT_TOP].push(new LocationControl(map));
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(new SearchField(map));

  // Cloud layer's cool but fairly useless
  // var cloudLayer = new google.maps.weather.CloudLayer();
  // cloudLayer.setMap(map);

  gapi.hangout.data.onStateChanged.add(
    function (event) {
      console.log("State changed:");
      maskerStr = gapi.hangout.data.getState();
      console.log(maskerStr.marker);

      var coords = maskerStr.marker.substring(1, maskerStr.marker.length - 1).split(', ');

      var myLatlng = new google.maps.LatLng(coords[0], coords[1]);
      var marker = new google.maps.Marker({
          position: myLatlng,
          title:"Hello World!"
      });
      //console.log('test');
      //console.log(marker);
      //console.log(marker.setMap(map));
      marker.setMap(map);

/*
      var myLatlng = new google.maps.LatLng(-25.363882,131.044922);
      var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);



      // To add the marker to the map, call setMap();

*/
      var id, latlng;

        for (var i = 0; i < event.addedKeys.length; i++) {
          id = event.addedKeys[i].key;  // The key is the unique participant ID of the other participant
          value = JSON.parse(event.addedKeys[i].value);  //Also see above in the shareLocation function
          console.log(event.addedKeys[i]);



          // Add marker
          //createLocationMarker(id, value.location, map);

        }
  });

}


function SearchField(map) {

  var searchInput = document.createElement('input');
  searchInput.type = "text";
  searchInput.setAttribute("id", "search-input");
  searchInput.setAttribute("x-webkit-speech", "");
  searchInput.setAttribute("autocorrect", "off");

  var autocomplete = new google.maps.places.Autocomplete(searchInput);
  autocomplete.bindTo('bounds', map);

  var infowindow = new google.maps.InfoWindow();
  var marker = new google.maps.Marker({
    map: map
  });

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    infowindow.close();
    var place = autocomplete.getPlace();
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);  // Why 17? Because it looks good.
    }
    //alert(autocomplete.getBounds());
    var image = new google.maps.MarkerImage(
        place.icon, new google.maps.Size(71, 71),
        new google.maps.Point(0, 0), new google.maps.Point(17, 34),
        new google.maps.Size(35, 35));
    marker.setIcon(image);
    marker.setPosition(place.geometry.location);

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] &&
         place.address_components[0].short_name || ''),
        (place.address_components[1] &&
         place.address_components[1].short_name || ''),
        (place.address_components[2] &&
         place.address_components[2].short_name || '')].join(' ');
    }
    var rating = (place.rating) ? place.rating+' - ':'';
    var phone = (place.formatted_phone_number) ? place.formatted_phone_number:'';
    var website = (place.website) ? '<br><a href=\"'+place.website+'\" target=\"_blank\">'+place.website+'</a>':'';

    infowindow.setContent('<div><b>' + place.name + '</b><br>'+ rating +'<a href=\"'+place.url+'\" target=\"_blank\">more info</a><br>' + place.formatted_address + "<br>" + phone + website);
    infowindow.open(map, marker);
  });

  return searchInput;

}

function LocationControl(map) {

  var controlDiv = document.createElement('div');

  // Control container DIV
  var myLocationControl = document.createElement('div');
  myLocationControl.setAttribute("id", "my-location-control");
  myLocationControl.title = 'Show my location';
  controlDiv.appendChild(myLocationControl);

    // Button state in off state
  var myLocationOn = document.createElement('div');
  myLocationOn.setAttribute("id", "my-location-button");
  myLocationOn.setAttribute("class", "off");
  myLocationControl.appendChild(myLocationOn);

  // Spinner overlay
  var spinnerUI = document.createElement('div');
  spinnerUI.setAttribute("id", "my-location-spinner");
  myLocationOn.appendChild(spinnerUI);

  // Current location marker
  // Latitude style image: https://latitude.google.com/latitude/apps/static/friends/friend_placard.png
  var myLocationCanvas = document.createElement("canvas");
  myLocationCanvas.width = 76;
  myLocationCanvas.height = 82;
  var myLocationContext = myLocationCanvas.getContext("2d");

  var mylocLat = new google.maps.Marker({
      clickable: true,
      icon: myLocationCanvas.toDataURL(),
      zIndex: 999,
      visible: false,
      map: map
  });
  var myLocationInfo = new google.maps.InfoWindow();

  // Location marker background image
  var imageMarker = new Image();
  imageMarker.crossOrigin = 'anonymous';
  imageMarker.src = "https://lh6.googleusercontent.com/-WD2hqsOWfAU/ULffJGJoftI/AAAAAAAAJXo/tGKym-Kxdlg/s152/friend_placard.png";
  imageMarker.onload = function() { myLocationContext.drawImage(this, 0, 0); };

  // User profile image
  var imageAvatar = new Image();
  imageAvatar.crossOrigin = 'anonymous';
  imageAvatar.src = gapi.hangout.getParticipantById(gapi.hangout.getParticipantId()).person.image.url;
  imageAvatar.onload = function() { myLocationContext.drawImage(this, 13, 9, 50, 50); mylocLat.icon = myLocationCanvas.toDataURL() };

  // Legacy location marker. Delete later.
  var iconMarker = new google.maps.MarkerImage("//latitude.google.com/latitude/apps/static/friends/friend_placard.png",
      new google.maps.Size(76, 82));

  // Accuracy circle
  accuracyCircle = new google.maps.Circle({
    strokeColor: "#6699CC",
    strokeOpacity: 0.7,
    strokeWeight: 1,
    fillColor: "#6699CC",
    fillOpacity: 0.1,
    visible: false,
    map: map
  });

  // Setup the click event listeners: simply set the map to Chicago.
  google.maps.event.addDomListener(myLocationControl, 'click', function() {

    // Try W3C Geolocation (Preferred)
    if(mylocLat.getVisible()) {
      mylocLat.setVisible(false);
      accuracyCircle.setVisible(false);
      myLocationOn.setAttribute("class", "off");
    }
    else {
      myLocationOn.setAttribute("class", "wait");
      spinnerUI.style.display = 'block';

      if(navigator.geolocation) {
        browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position) {
          initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
          // Center the map at current location and zoom
          map.setCenter(initialLocation);
          map.setZoom(18);
          // Show location marker
          //myloc.setPosition(initialLocation);
          //myloc.setVisible(true);

          //mylocLat.icon = myLocationCanvas.toDataURL();
          mylocLat.setPosition(initialLocation);
          mylocLat.setVisible(true);
          mylocLat.title = gapi.hangout.getParticipantById(gapi.hangout.getParticipantId()).person.displayName;

          accuracyCircle.setCenter(initialLocation);
          accuracyCircle.setRadius(position.coords.accuracy);
          //accuracyCircle.setVisible(true);

          spinnerUI.style.display = 'none';
          myLocationOn.setAttribute("class", "on");
          var geocoder = new google.maps.Geocoder();
          geocoder.geocode({'latLng': initialLocation}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                      if (results[0]) {
                        //console.log(results);
                        var displayName = gapi.hangout.getParticipantById(gapi.hangout.getParticipantId()).person.displayName;
                        var locationCity = results[0].address_components[3].long_name;
                        var locationCountry = results[0].address_components[5].long_name;
                        var now = new Date();
                        var currMinutes = (now.getMinutes()<10) ? "0"+now.getMinutes(): now.getMinutes();
                        var currTime = now.getHours()+":"+currMinutes;
                        myLocationInfo.setContent("<b>"+displayName+"</b><br>"+locationCity+", "+locationCountry+"<br>"+currTime);

                        //console.log(gapi.hangout.data.getState());
                      }
                    }
          });

          // Push location to the shared state
          var now = new Date();
          gapi.hangout.data.setValue(gapi.hangout.getParticipantId(), JSON.stringify({location: initialLocation, offset: now.getTimezoneOffset()}));


        }, function() {
          handleNoGeolocation(browserSupportFlag);
        });
      }
      // Browser doesn't support Geolocation
      else {
        browserSupportFlag = false;
        handleNoGeolocation(browserSupportFlag);
      }
    }
      });
  google.maps.event.addDomListener(mylocLat, 'click', function() {
    myLocationInfo.open(map, mylocLat);
    accuracyCircle.setVisible(true);
  });

  return controlDiv;
}

function init() {
  // When API is ready...
  gapi.hangout.onApiReady.add(
      function(eventObj) {
        if (eventObj.isApiReady) {
          initialize();
        }
      });
}

/*checkins from foursquare*/
function Places() {
    // Data
    var self = this;
    self.places = ko.observableArray([]);
    self.coord = ko.observable('40.7,-74');

    self.token = 'G4ADOMFGJXZLLSSWAPPQRBOIFFDHDKSVOTSRHIUQIVKKISXV';
    self.url = 'https://api.foursquare.com/v2/venues/explore?ll=' + self.coord() + '&oauth_token=' + self.token + '&v=20130407';
    $.ajax({
        url: self.url,
        type: 'GET',
        success: function(res) {
            console.log(res);
            self.places(res.response.groups[0].items);
        }
    });

    self.addMarker = function(obj) {
        console.log(obj.venue.location);
        var myLatlng = new google.maps.LatLng(obj.venue.location.lat, obj.venue.location.lng);
        var marker = new google.maps.Marker({
            position: myLatlng,
            title: obj.venue.name
        });
        marker.setMap(map);
        map.setCenter(marker.getPosition());

        gapi.hangout.data.submitDelta( {marker: marker.getPosition().toString(), title: obj.venue.name} );
    }
}

ko.applyBindings(new Places());

// Wait for gadget to load.
gadgets.util.registerOnLoadHandler(init);