(function ($) { // För att undvika konflikter med andra bibliotek.
	$(document).ready(function () { // Om DOM är färdiginläst.
		var url = 'http://skola.dnest.se/wpjson/wp-json'; // Skapa en global variabel med länk.
		var currSection = null; // Skapa en global variabel för att hålla koll på vilken sektion som är aktiv.
		var postsData = ''; // Skapa en global variabel för posters data att lagras i.
		var mediaData = ''; // Skapa en global variabel för bilders data att lagras i.

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
      return endZone < $(window).scrollTop() + 20; // Returnerar true eller false beroende på om objektets top-värde är större eller mindre är fönstrets översta position.
    } // Slut på scrolledPast.

		function scrollEvent(mediaObject) { // Funktion som tar emot ett objekt som parameter.
			onScroll(mediaObject); // Kör onScroll direkt vid inläsning av sida för att lägga till bakgrund och markera rätt i menyn.

			$(window).on('scroll', function () { // Lyssnar på eventet "scroll". Körs varje gång man skrollar.
				onScroll(mediaObject);
    	});
		} // Slut på scrollEvent.

		function onScroll(mediaObject) {
			var $relevantSection = $('section').filter(function () { // Väljer alla sections med filtrerar ut de som inte får värdet true via funktionen scrolledPast. Returnerar ett jQuery-objekt för den sektion som för tillfälligt är "aktiv".
				return scrolledPast($(this)); // Returernar true eller false.
			}).last(); // Returernar den sista bland de matchade sektionerna.

			if($relevantSection.length) { // Om variabeln $relevantSection innehåller något.
				if(currSection == null || currSection != $relevantSection.attr('id')) { // Om currSection är null eller om currSection INTE är det samma som den nuvarande sektionen.
					currSection = $relevantSection.attr('id'); // Lagra ny sektion i currSection.
					$('nav a.active').removeClass('active'); // Ta bort klassen active på a-elementen.
					var tempVar = '#' + currSection; // Använd en temporär variabel för att slå ihop hash-teckent med id.

					$('nav a[href="' + tempVar + '"]').addClass('active'); // Lägg klassen active på a-elementet som har samma id-nummer som sektionen.

					$('.bg').stop().css({ // Stoppa pågående animation och styla div.bg med inline style.
						'background-image': 'url("'+ mediaObject[$relevantSection.attr('id')].pic +'")', // Sätter bakgrundsbild utifrån vad som finns i media-objektet.
						'background-repeat': 'no-repeat', // CSS-regel för att bilden inte ska repeteras.
						'background-attachment': 'fixed', // CSS-regel för att bilden inte ska skrolla.
						'background-size': 'cover', // CSS-regel för att fylla hela fönstret.
						'opacity': '0' // CSS-regel för att ändra opaciteten (genomskinlighet)
					}).animate({ // Animera genom att förändra opaciteten.
						opacity: 1
					}, 800); // 500 är hur lång tid animationen ska hålla på.
				}
			} else { // Om ingen sektion med id hittas så rensa all tidigare styling.
				currSection = null; // Sätt currSection till null om inget är valt.
				$('.bg').stop().css({ // Stopppa påbående animation, styla body med inline style.
					'background-image': '', // Sätter bakgrundsbild utifrån vad som finns i media-objektet.
					'background-repeat': '', // CSS-regel för att bilden inte ska repeteras.
					'background-attachment': '', // CSS-regel för att bilden inte ska skrolla.
					'background-size': '', // CSS-regel för att fylla hela fönstret.
					'opacity': '0' // CSS-regel för att ändra opaciteten (genomskinlighet)
				}).animate({
					opacity: 1
				}, 800);
			}
		}

		function loadAjax() { // Funktion som kör igång hämtning av Wordpress REST API data.
			$('.wrapper').hide(); // Döljer hela sidan, så inga "tomma" DIV-element visas.
			$('.modal-overlay').addClass('is-visible'); // Lägger till css-klassen is-visible.
			$('.modal').addClass('is-visible');
			$('.modal').html('<img src="img/ajax-loader.gif" alt="">'); // Ersätter allt innehåll i elementet som har klassen modal med en bild.

			// För att köra fler än ett Aja-anrop på samma gång används jQuery-klassen when tillsammans med jQuery-klassen ajax.
			$.when($.ajax(url + '/wp/v2/posts/?_embed=true'), $.ajax(url + '/wp/v2/media/?_embed=true')) // Kör två ajax-anrop
			.done(function (ajaxPosts, ajaxMedia) { // När körningen är klar, hämta data.
				postsData = ajaxPosts[0]; // Lagra data i global variabel.
				mediaData = ajaxMedia[0]; // Lagra data i global variabel.

				$('.wrapper').show(); // Visa sidan.
				$('.modal-overlay').removeClass('is-visible'); // Ta bort css-klassen is-visible.
				$('.modal').removeClass('is-visible');
				$('.modal').html(''); // Tömmer elementet med klassen modal (infogar ingenting).
			})
			.then(loadSucess, loadError); // Anropa funktioner loadSucess om allt lyckades, annars om någon av ajax-körningarna misslyckades så kör loadError.
		}

		function loadSucess() { // Kör alla funktioner som ska köras när alla hämtningar är färdiga.
			createNav(postsData); // Skapar en meny utifrån postsData.
			createPosts(postsData); // Skapar poster uifrån postsData.
			createGallery(mediaData); // Skapar ett galleri utifrån mediaData.
		}

		function loadError() { // När ajax-körningen misslyckas...
			$('.modal-overlay').removeClass('is-visible');
			$('.modal').removeClass('is-visible');
			$('.modal').html(''); // Tömmer elementet med klassen modal (infogar ingenting).

			$('.container').html('Misslyckades med att ladda in data från Wordpress.'); // Skriver ett felmeddelande till .container.
		}

		function createNav(data) { // SKapa navigation.
			var htmlContent = '<ul>'; // Skapar en ny variabel som all html ska ligga i.

      for (var i = 0; i < data.length; i++) { // Loopar igenom data-objektet som skickats med som parameter.
        var postData = data[i]; // Skapar variabel som pekar på data[i], för att förenkla.
        htmlContent += '<li><a href="#' + postData.id + '">' + postData.title.rendered + '</a></li>'; // Lagrar posters titlar för användning i menyn.
			}

			htmlContent += '<li><a href="#gallery">Galleri</a></li>'; // Lägger till meny-val för galleriet.
			htmlContent += '</ul>';

			$('nav').html(htmlContent); // Lägger till all navigation i nav.
			eventListening(); // Kör funktionen eventListening för att lägga till lyssnare för menyn.
		} // Slut på createNav.

		function createGallery(data) { // Skapa galleriet utifrån den hämtade datan.
			$('#gallery').before('<h2>Galleri</h2>\n'); // Lägger till en h2-rubrik innan elementet med id gallery.
			var htmlContent = ''; // Skapar en ny "tom" variabel där all html ska ligga i.
			var pictureArray = []; // Skapa array för att lagra bilder i.
			var currListID = ''; // Skapa variabel för att veta vilken bild som för nuvarande är vald.

			for (var i = 0; i < data.length; i++) { // Loopar igenom data-objektet som skickats med som parameter.
				htmlContent += '<a href="' + data[i].media_details.sizes.medium_large.source_url + '" data-id="' + i + '"><img src="' + data[i].media_details.sizes.thumbnail.source_url + '" alt=""></a>'; // Lägger till alla bilder som hittas.
				pictureArray.push(data[i].media_details.sizes.medium_large.source_url); // Lägg till en ny bild i arrayn.
			}

			$('#gallery').html(htmlContent); // Lägger till alla bilderna i elementet med id gallery.

			$('#gallery').on('click', 'a', function (e) { // Skapar lyssnare på alla bilder som lagts till.
				e.preventDefault(); // Förhindrar att a-elementet fungerar som vanligt.

				var link = $(this).attr('href'); // Hämtar värdet som finns i href för a-elementet som klickats på.
				currListID = $(this).attr('data-id'); // Hämta värdet som finns lagrat i attributet "data-id".

				$('.modal-overlay').addClass('is-visible');
				$('.modal').addClass('is-visible');

				$('.modal').html('<button class="prev-btn">Föregående</button><img src="'+ link +'" alt="" class="showed-img"><button class="next-btn">Nästa</button>'); // Skriver över innehållet för elementet med klassen modal med en ny bild och knappar för föregående och nästa.

				$('.modal-overlay').on('click', function () { // Gör det möjligt att stänga modal-elementet genom att klicka "utanför".
					$('.modal-overlay').removeClass('is-visible');
					$('.modal').removeClass('is-visible');
				}); // Slut för onClick för modal-overlay.

				$('.modal button.prev-btn').on('click', function (e) { // Skapar en lyssnare för "föregående"-knappen.
					e.preventDefault();

					if ((Number(currListID) - 1) < 0) { // Om användaren klickar på föregående, men är på första bilden. Använder javascript-funktionen Number för att konvartera currListID till integer istället för string.
						currListID = pictureArray.length - 1; // Ta då arrayns längd minus ett för att få sista bildens ID.
					} else {
						currListID = Number(currListID) - 1; // Annars ta nuvarande ID minus ett för att gå bakåt.
					}

					$('.modal img.showed-img').attr('src', pictureArray[currListID]); // Ändra attributet src för bilden till den nya bilden.
				});

				$('.modal button.next-btn').on('click', function (e) { // Skapa en lyssnare för "nästa"-knappen.
					e.preventDefault();

					if ((Number(currListID) + 1) > pictureArray.length - 1) { // Om det inte finns fler bilder att visa så börja om från början.
						currListID = 0;
					} else {
						currListID++; // Annars gå till nästa bild.
					}

					$('.modal img.showed-img').attr('src', pictureArray[currListID]);
				});
			}); // Slut på onClick för bilderna.
		} // Slut på createGallery.

    function createPosts(data) { // Skapar utseendet för posterna.
			var fullMedia = new Object(); // Skapar ett object för att lagra relevanta bilder.
      var htmlContent = ''; // Skapar en ny "tom" variabel som all html ska ligga i.

      for (var i = 0; i < data.length; i++) { // Loopar igenom data-objektet som skickats med som parameter.
        var postData = data[i]; // Skapar variabel som pekar på data[i], för att förenkla.

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

		// Kör igång funktionen loadAjax för att hämta data från Wordpress REST API.
    loadAjax();
	});
})(jQuery); // För att undvika konflikter med andra bibliotek.
