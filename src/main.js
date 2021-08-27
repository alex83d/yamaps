let myMap;
const data = {};

const myBalloon = document.querySelector('#window_balloon');
const closeButton = document.querySelector('#button__close');
const addButton = document.querySelector('#button__add');
const address = document.querySelector('#address');
const inputName = document.querySelector('#input-name');
const inputPlace = document.querySelector('#input-place');
const comments = document.querySelector('#comments');
const inputText = document.querySelector('#input-text');
const placemarks = []; // массив с метками;


let toObject = (p) => {
  for(let i = 0; i< p.length; i++) {
    if (p[i] !== undefined) {
    data[i] = p[i];
    }
    //({_coordinates: data.coord} = p[i]["geometry"]);
  }
}

let addToLocalStorage = (obj) => {
  localStorage.clear();
  localStorage.setItem('obj', obj);
}


closeButton.addEventListener('click', () => {
  myBalloon.style.display = 'none';
  clearInputs();
});

function clearInputs() {
  inputName.value = '';
  inputPlace.value = '';
  inputText.value = '';
}

function openBalloon() {
  myBalloon.style.top = event.pageY + 'px';
  myBalloon.style.left = event.pageX + 'px';
  myBalloon.style.display = 'block';
}

function openBalloonCollection() {
  address.innerText = '';
  comments.innerHTML = '';
  const addressLink = document.querySelector('.balloon__address_link');

  for (let i = 0; i < placemarks.length; i++) {
    if (addressLink.innerText === placemarks[i].place) {
      address.innerText = placemarks[i].place;
      comments.innerHTML = placemarks[i].commentContent;
    }
  }
  myBalloon.style.top = event.pageY + 'px';
  myBalloon.style.left = event.pageX + 'px';
  myBalloon.style.display = 'block';
}

async function init() {
  await this.injectYMapsScript();
  await this.loadYMaps();
  this.initMap();
}

init();

// подключение api yandexMap
function injectYMapsScript() {
  return new Promise((resolve) => {
    const ymapsScript = document.createElement('script');
    ymapsScript.src =
      'https://api-maps.yandex.ru/2.1/?apikey=5a4c2cfe-31f1-4007-af4e-11db22b6954b&lang=ru_RU';
    document.body.appendChild(ymapsScript);
    ymapsScript.addEventListener('load', resolve);
  });
}

function loadYMaps() {
  return new Promise((resolve) => ymaps.ready(resolve));
}

function initMap() {
  let myMark;
  let coordinates;
  myMap = new ymaps.Map(
    'map', {
      center: [59.93916998692174, 30.309015096732622], //spb coordinates
      zoom: 12,
      controls: [
        'typeSelector', // Переключатель слоев карты

        // Поисковая строка
        new ymaps.control.SearchControl({
          options: {
            // вид - поисковая строка
            size: 'large',
            // Включим возможность искать не только топонимы, но и организации.
            provider: 'yandex#search',
          },
        }),
      ],
    }, {
      searchControlProvider: 'yandex#search',
    }
  );
  // Создание кластера.
  const clusterer = new ymaps.Clusterer({
    preset: 'islands#blueClusterIcons',
    groupByCoordinates: true,
    clusterDisableClickZoom: true,
    clusterHideIconOnBalloonOpen: false,
    geoObjectHideIconOnBalloonOpen: false,
    clusterOpenBalloonOnClick: true,
    clusterBalloonContentLayout: 'cluster#balloonCarousel',
    clusterBalloonPagerSize: 10,
  });

  clusterer.add(placemarks);
  myMap.geoObjects.add(clusterer);

  // событие клик на карте
  myMap.events.add('click', (e) => {
    let coords;
    coords = e.get('coords');
    coordinates = coords;
    comments.innerHTML = 'нет комментариев';

    // открываем окно с отзывами и формой.
    openBalloon();
    myMark = createPlacemark(coords);
    getAddress(coords);
  });

  // Создание метки
  function createPlacemark(coords) {
    return new ymaps.Placemark(coords);
  }

  //  обратное геокодирование
  function getAddress(coords) {
    ymaps.geocode(coords).then(function (res) {
      const firstGeoObject = res.geoObjects.get(0);

      myMark.properties.set({
        // Формируем строку с данными об объекте.
        iconCaption: [
          // Название населенного пункта или вышестоящее административно-территориальное образование.
          firstGeoObject.getLocalities().length ?
          firstGeoObject.getLocalities() :
          firstGeoObject.getAdministrativeAreas(),
          // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
          firstGeoObject.getThoroughfare() || firstGeoObject.getPremise(),
        ],
        // контент балуна: задаем строку с адресом объекта.
        balloonContent: firstGeoObject.getAddressLine(),
      });
      address.innerText = firstGeoObject.getAddressLine();
    });
  }

  addButton.addEventListener('click', () => {
    if (inputName.value && inputPlace.value && inputText.value) {
      const addressLink = address.innerText;

      // текущее время
      const date = new Date();

      const currentTime =
        date.getDate() +
        '.' +
        date.getMonth() +
        '.' +
        date.getFullYear() +
        '(' +
        date.getHours() +
        ':' +
        date.getMinutes() +
        ')';

      // Создаём метку
      const newMark = new ymaps.Placemark(
        coordinates, {
          balloonContentHeader: inputPlace.value,
          balloonContentBody: `<a onclick="openBalloonCollection()" class="balloon__address_link">${addressLink}</a><br><br>${inputText.value}<br><br>`,
          balloonContentFooter: currentTime,
        }, {
          preset: 'islands#blueDotIcon',
          draggable: false,
          openBalloonOnClick: false,
        }
      );

      myMap.geoObjects.add(newMark);
      clusterer.add(newMark);
      placemarks.push(newMark);

      // Обновление содержимого балуна
      if (comments.innerHTML === 'нет комментариев') comments.innerHTML = '';
      newMark.commentContent = `<div><span><b>${inputName.value}</b></span>
        <span class="text">[${inputPlace.value}]</span>
        <time class="text">${currentTime}:</time><br>
        <p>${inputText.value}</p></div><br>`;
      comments.innerHTML = newMark.commentContent;
      newMark.place = address.innerText;

      clearInputs();

      newMark.events.add('click', () => {
        openBalloon();
        comments.innerHTML = newMark.commentContent;
        address.innerText = newMark.place;
      });
    } else {
      swal('внимание', 'заполните все поля', 'warning');
    }
  });

  // изменение placemarks
  placemarks.push = function() { Array.prototype.push.apply(this, arguments);
     console.log('event'); toObject(placemarks); addToLocalStorage(data)};
}

