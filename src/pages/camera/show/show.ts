const imageCdn = 'https://tdesign.gtimg.com/mobile/demos';
const swiperList = [
  `${imageCdn}/swiper1.png`,
  `${imageCdn}/swiper2.png`,
  `${imageCdn}/swiper1.png`,
  `${imageCdn}/swiper2.png`,
  `${imageCdn}/swiper1.png`,
];

Page({
  data: {
    icons: {
      books: '/assets/images/books.svg',
      music: '/assets/images/music.svg',
      camera: '/assets/images/camera.svg',
      timer: '/assets/images/timer.svg',
      switch: '/assets/images/switch.svg',
      note: '/assets/images/note.svg',
      baby: '/assets/images/baby.svg',
    },
    current: 0,
    autoplay: false,
    duration: 500,
    interval: 5000,
    swiperList,
  },
  onLoad() {

  }
})