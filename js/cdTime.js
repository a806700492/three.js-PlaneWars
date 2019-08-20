 class CdTime {
     constructor(boxId, cd, callback) {
         this._box_dom = document.getElementById(boxId)
         this._box_dom.classList.add("inner")
         this._cd = cd
         this._old_cd = cd
         this.callback = callback
     }

     init() {
         this._box_dom.innerHTML =
             ' <div class="cdTime"></div><div class="spiner"></div><div class="filler"></div><div class="masker"></div>'
         this._in_dom = this._box_dom.querySelector(".cdTime")
         this._s = this._box_dom.querySelector(".spiner")
         this._f = this._box_dom.querySelector(".filler")
         this._m = this._box_dom.querySelector(".masker")
     }

     start() {
         let cdFloat = null
         this.init()
         this._cd = this._old_cd
         this._s.classList.add('ani1')
         this._f.classList.add('ani2')
         this._m.classList.add('ani3')
         this._m.style.animationDuration = this._f.style.animationDuration = this._s.style
             .animationDuration = this._cd + 's'
         this._cd > 1 && (this._in_dom.innerHTML = this._cd--)

         const cdT = setInterval(() => {
             if (this._cd <= 1) {
                 clearInterval(cdT)
                 this._in_dom.innerHTML = this._cd

                 cdFloat = setInterval(() => {
                     this._in_dom.innerHTML = this._cd.toFixed(1)
                     this._cd -= 0.1

                     if (this._cd <= 0) {
                         clearInterval(cdFloat)
                         this._in_dom.innerHTML = ''
                         this._s.classList.remove('ani1')
                         this._s.classList.remove('ani2')
                         this._s.classList.remove('ani3')
                         this.callback && this.callback()
                     }
                 }, 100)

             } else {
                 this._in_dom.innerHTML = this._cd--
             }
         }, 1000)
     }
 }