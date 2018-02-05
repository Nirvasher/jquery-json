(function ($) { // För att undvika konflikter med andra bibliotek.
	$(document).ready(function () { // Om DOM är färdiginläst.
		var url = 'http://skola.dnest.se/wpjson/wp-json'; // Skapa en global variabel med länk.
		var listContent = ''; // Skapa en tom global variabel för senare användning.
		var gallerySuccess = false; // Skapa en global variabel för senare användning.

		function eventListening() {
			$('nav a').on({ // Lägger en lyssnare på a-elementen i nav.
				click: function (e) { // Kör den annonyma funktionen vid klick.
					e.preventDefault(); // Förhindrar att länken fungerar som vanligt.

					$('nav a.active').removeClass('active'); // Tar bort klassen active från de a-element som har klassen active.
					$(this).addClass('active'); // Lägger till klassen active på det klickade a-elementet.
					var navID = $(this).prop('hash'); // Lägger hash-värdet (ID-numret) från a-elementet i en variabel.
					$('html, body').animate({ // Kör jQuery-animate på html och body för att animera skrollningen.
						scrollTop: $(navID).offset().top // Skrollar till elementet med det valda id-numret.
					});
				},
				mouseenter: function () { // Kör annonym funktion när musen "entrar" a-elementet.
					$(this).addClass('hover'); // Lägger till klassen hover på det valda a-elementet.
				},
				mouseleave: function () { // Kör annonym funktion när musen lämnar a-elementet.
					$(this).removeClass('hover'); // Tar bort klassen hover på det valda a-elementet.
				}
			});
		} // Slut på eventListening.

		function scrolledPast($object) { // Funktion som tar emot ett jQuery-objekt som parameter.
      var endZone = $object.offset().top; // Variabel med värdet på objektets top position.
      return endZone < $(window).scrollTop(); // Returnerar true eller false beroende på om objektets top-värde är större eller mindre är fönstrets översta position.
    } // Slut på scrolledPast.

		function scrollEvent(mediaObject) { // Funktion som tar emot ett objekt som parameter.
			$(window).on('scroll', function () { // Lyssnar på eventet "scroll". Körs varje gång man skrollar.
				var $relevantSection = $('section').filter(function () { // Väljer alla sections med filtrerar ut de som inte får värdet true via funktionen scrolledPast. Returnerar ett jQuery-objekt för den sektion som för tillfälligt är "aktiv".
					return scrolledPast($(this)); // Returernar true eller false.
				}).last(); // Returernar den sista bland de matchade sektionerna.

				if($relevantSection.length) { // Om variabeln $relevantSection innehåller något.
					$('body').css({ // Styla body med inline style.
						'background-image': 'url("'+ mediaObject[$relevantSection.attr('id')].pic +'")', // Sätter bakgrundsbild utifrån vad som finns i media-objektet.
						'background-repeat': 'no-repeat', // CSS-regel för att bilden inte ska repeteras.
						'background-attachment': 'fixed', // CSS-regel för att bilden inte ska skrolla.
						'background-size': 'cover' // CSS-regel för att fylla hela fönstret.
					});
				} else { // Om variabeln $relevantSection inte innehåller något.
					$('body').css({ // Töm alla css-regler.
						'background-image': '',
						'background-repeat': '',
						'background-attachment': '',
						'background-size': 'cover'
					});
				}
    	});
		} // Slut på scrollEvent.

    function loadData() { // Ladda in poster.
      $.ajax({ // Kör ajax-klassen som finns i jQury.
        url: url + '/wp/v2/posts/?_embed=true', // Vald url som JSON hämtas från.
        method: 'get', // GET-metoden används, eftersom vi hämtar värdet.
        timeout: 2000, // Timeout, hur lång tid ajax-anropet har på sig.
        beforeSend: function () { // Annonym funktion som körs innan hämtningen görs.
					$('.modal-overlay').addClass('is-visible');
					$('.modal').addClass('is-visible');
					$('.modal').html('<img src="img/ajax-loader.gif" alt="">'); // Ersätter allt innehåll i elementet som har klassen modal med en bild.
        },
        complete: function () { // Annonym funktion som körs när ajax-körningen är helt klar. Det allra sista som körs.
					$('.modal-overlay').removeClass('is-visible');
					$('.modal').removeClass('is-visible');
					$('.modal').html(''); // Tömmer elementet med klassen modal (infogar ingenting).
					loadGallery(); // Kör funktionen loadGallery som börjar ladda in galleriet.
        },
        success: function (data) { // Annonym funktion som körs om hämtningen lyckades.
          createPosts(data); // Kör createPosts där parametern data skickas med.
        },
				error: function () { // Annonym funktion som körs om hämtningen misslyckades.
					$('.container').html('Misslyckades med att ladda in poster från Wordpress.'); // Skriver ett felmeddelande till .container.
				}
      });
    } // Slut på loadData.

		function loadGallery() { // Ladda in galleriet.
			$.ajax({
				url: url + '/wp/v2/media/?_embed=true', // Samma som tidigare, bara att nu hämtas endast mediadelen av JSON.
				method: 'get',
				timeout: 2000,
				beforeSend: function () {
					$('#gallery').html('Laddar in galleri-data...');
				},
				success: function (data) {
					gallerySuccess = true; // Meddelar att galleriet skapades utan problem.
					createGallery(data); // Kör funktionen createGallery med parametern data.
				},
				complete: function () {
					createNav(); // Skapa navigation då alla ajax-körningar är slutförda.
				},
				error: function () {
					$('#gallery').html('');
					$('#gallery').before('Misslyckades med att ladda in galleri-data.')
				}
			});
		} // Slut på loadGallery.

		function createNav() { // SKapa navigation.
			var navContent = '<ul>'; // Lägger ul i en variabel.
			navContent += listContent; // Lägger till innehållet från listContent i navContent.
			if (gallerySuccess) { // Om galleriet skapades utan problem.
				navContent += '<li><a href="#gallery">Galleri</a></li>'; // Så läggs länken till i variabeln navContent.
			}
			navContent += '</ul>';

			$('nav').html(navContent); // Lägger till all navigation i nav.
			eventListening(); // Kör funktionen eventListening för att lägga till lyssnare för menyn.
		} // Slut på createNav.

		function createGallery(data) { // Skapa galleriet utifrån den hämtade datan.
			$('#gallery').before('<h2>Galleri</h2>\n'); // Lägger till en h2-rubrik innan elementet med id gallery.
			var htmlContent = ''; // SKapar en ny "tom" variabel där all html ska ligga i.

			for (var i = 0; i < data.length; i++) { // Loopar igenom data-objektet som skickats med som parameter.
				htmlContent += '<a href="' + data[i].media_details.sizes.medium_large.source_url + '"><img src="' + data[i].media_details.sizes.thumbnail.source_url + '" alt=""></a>'; // Lägger till alla bilder som hittas.
			}

			$('#gallery').html(htmlContent); // Lägger till alla bilderna i elementet med id gallery.

			$('#gallery').on('click', 'a', function (e) { // Skapar lyssnare på alla bilder som lagts till.
				e.preventDefault(); // Förhindrar att a-elementet fungerar som vanligt.

				var link = $(this).attr('href'); // Hämtar värdet som finns i href för a-elementet som klickats på.
				$('.modal-overlay').addClass('is-visible');
				$('.modal').addClass('is-visible');

				$('.modal').html('<img src="'+ link +'" alt="" class="showed-img">'); // Skriver över innehållet för elementet med klassen modal med en ny bild.
			}); // Slut på onClick för bilderna.

			$('.modal-overlay').on('click', function () { // Gör det möjligt att stänga modal-elementet genom att klicka "utanför".
				$('.modal-overlay').removeClass('is-visible');
				$('.modal').removeClass('is-visible');
			}); // Slut för onClick för modal-overlay.
		} // Slut på createGallery.

    function createPosts(data) { // Skapar utseendet för posterna.
			var fullMedia = new Object(); // Skapar ett object för att lagra relevanta bilder.
      var htmlContent = ''; // Skapar en ny "tom" variabel som all html ska ligga i.

      for (var i = 0; i < data.length; i++) { // Loopar igenom data-objektet som skickats med som parameter.
        var postData = data[i]; // Skapar variabel som pekar på data[i], för att förenkla.
        listContent += '<li><a href="#' + postData.id + '">' + postData.title.rendered + '</a></li>'; // Lagrar länk till postens id i en global variabel då den ska användas senare i en annan funktion.

        htmlContent += '<section id="' + postData.id + '">\n'; // Skapar ett section-element med postens id.
        htmlContent += '<a href="' + postData.link + '"><h2>' + postData.title.rendered + '</h2></a>\n'; // Skapar en rubrik med postens titel.
        if (postData.featured_media) { // Om det finns någon utvald bild kopplad till nuvarande posten.
          for (var i2 = 0; i2 < postData._embedded['wp:featuredmedia'].length; i2++) { // Loop om det finns fler än en utvald bild.
            var featuredMedia = postData._embedded['wp:featuredmedia'][i2]; // Lagra nuvarande bild i variabel.
            var media = ''; // Skapa tom variabel för att lagra "rätt" bild.

						// Lagrar postID och utvald bild (i full storlek) i ett objekt.
						fullMedia[postData.id] = {
							pic: featuredMedia.media_details.sizes.full.source_url
						};

            if(featuredMedia.media_details.sizes.medium_large) { // Om en utvald bild finns i storleken medium_large, så lagra den i media-variabeln.
              media = featuredMedia.media_details.sizes.medium_large.source_url;
            } else { // Om inte, använd full storlek och lagra den i media-variabeln.
              media = featuredMedia.media_details.sizes.full.source_url;
            }
            htmlContent += '<img src="' + media + '" alt="" class="featured-img">\n'; // Lagra den färdiga bilden i htmlContent.
          }
        }
        htmlContent += postData.content.rendered; // Lagra själva brödtexten/textinnehållet i htmlContent.
        htmlContent += '\n</section>'; // Avsluta med section-elementet.
      }

      $('.container').append(htmlContent); // Lägg till alla poster som finns i variabeln htmlContent och lägg till det i elementet med klassen container.

			scrollEvent(fullMedia); // Kör scrollEvent-funktionen och skickar med parametern fullMedia som är ett objekt.
    } // Slut på createPosts.

		// Kör igång funktionen loadData.
    loadData();
	});
})(jQuery); // För att undvika konflikter med andra bibliotek.
