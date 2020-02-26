const randomImage = [
    "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__5___gVErlfkr.jpeg",
    "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__4__bcJrAnNDS.jpeg",
    "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__3__G3mwd4sOJt.jpeg",
    "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__2__rzdmaMNz8e.jpeg",
    "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__1__IrwwDBdiP.jpeg",
    "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM_QsD9fMMl-.jpeg"
]


exports.profileImage = () => {
    return randomImage[Math.floor(Math.random() * randomImage.length)];
}