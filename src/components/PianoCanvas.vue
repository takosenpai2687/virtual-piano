<template>
  <div class="fixed inset-0 bg-gray-900 overflow-hidden">
    <!-- Star Background Layer -->
    <div class="stars-container">
      <div class="stars-box">
        <div class="stars stars-1"></div>
        <div class="stars stars-2"></div>
        <div class="stars stars-3"></div>
      </div>
      <div class="stars-box stars-box-duplicate">
        <div class="stars stars-1"></div>
        <div class="stars stars-2"></div>
        <div class="stars stars-3"></div>
      </div>
      <div class="fog-layer"></div>
      <div class="horizon-glow"></div>
    </div>

    <!-- Animated Electric Wave Border -->
    <canvas v-if="!isLandscapeMobile" ref="waveCanvasRef" class="wave-border-canvas"></canvas>

    <!-- Canvas for Piano -->
    <canvas ref="canvasRef" class="absolute w-full h-full z-10" @mousedown="onMouseDown" @mouseup="onMouseUp"
      @mousemove="onMouseMove" @touchstart="onMouseDown" @touchend="onMouseUp" @touchmove="onMouseMove"
      @contextmenu.prevent />

    <!-- Dynamic Island Control Panel -->
    <div
      class="fixed top-4 left-1/2 transform -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gray-900/80 backdrop-blur-xl rounded-full shadow-2xl border border-gray-700 z-50 text-white transition-all hover:bg-gray-900/95"
      style="max-width: 95vw;">

      <!-- Upload -->
      <MidiUploader @notesConverted="onNotesConverted" @sheetSaved="onSheetSaved" />

      <div class="hidden sm:block w-px h-8 bg-gray-700 mx-1"></div>

      <!-- Controls -->
      <button @click="seek(-10000)"
        class="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-pink-400 transition-all text-gray-300 active:scale-95"
        title="Rewind 10s">
        <i class="fas fa-backward text-sm sm:text-base"></i>
      </button>

      <button @click="stop"
        class="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-red-400 transition-all text-gray-300 active:scale-95"
        title="Stop">
        <i class="fas fa-stop text-sm sm:text-base"></i>
      </button>

      <button @click="togglePlayPause"
        class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 flex items-center justify-center text-white shadow-lg shadow-pink-600/30 transition-all active:scale-95 mx-1 sm:mx-2">
        <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'" class="text-lg sm:text-xl"></i>
      </button>

      <button @click="seek(10000)"
        class="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-pink-400 transition-all text-gray-300 active:scale-95"
        title="Forward 10s">
        <i class="fas fa-forward text-sm sm:text-base"></i>
      </button>

      <div class="hidden sm:block w-px h-8 bg-gray-700 mx-1"></div>

      <!-- Speed Control -->
      <button @click="cycleSpeed"
        class="px-2 sm:px-3 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-blue-400 transition-all text-gray-300 font-bold text-xs sm:text-sm active:scale-95"
        :title="`Playback Speed: ${playbackSpeed}x`">
        <i class="fas fa-gauge-high mr-1 sm:mr-1.5"></i>
        {{ playbackSpeed }}x
      </button>

      <div class="hidden sm:block w-px h-8 bg-gray-700 mx-1"></div>

      <!-- Volume Control -->
      <div class="relative flex items-center gap-2">
        <button @click="showVolumeSlider = !showVolumeSlider"
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-green-400 transition-all text-gray-300 relative group active:scale-95"
          :title="`Volume: ${Math.round(volume * 100)}%`">
          <i :class="['fas', volumeIcon, 'transition-all text-sm sm:text-base', volume > 0 ? 'animate-pulse-subtle' : '']"></i>
        </button>

        <!-- Volume Slider Popup -->
        <Transition enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100" leave-to-class="opacity-0 translate-y-2 scale-95">
          <div v-if="showVolumeSlider"
            class="absolute top-14 left-1/2 transform -translate-x-1/2 bg-gray-800/95 backdrop-blur-xl border border-gray-600 rounded-xl shadow-2xl p-3 z-50">
            <div class="flex flex-col items-center gap-2 w-12">
              <span class="text-xs text-gray-400 font-bold">{{ Math.round(volume * 100) }}%</span>
              <input type="range" v-model.number="volume" @input="updateVolume" min="0" max="1" step="0.01"
                class="volume-slider h-24 sm:h-32 w-2 appearance-none bg-gray-700 rounded-full cursor-pointer"
                style="writing-mode: vertical-lr; direction: rtl;" :style="{ '--volume-fill': (volume * 100) + '%' }" />
              <button @click="volume = volume > 0 ? 0 : 0.7; updateVolume()"
                class="text-xs text-gray-400 hover:text-white transition-colors">
                <i :class="['fas', volume > 0 ? 'fa-volume-off' : 'fa-volume-up']"></i>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <div class="hidden sm:block w-px h-8 bg-gray-700 mx-1"></div>

      <!-- Sheet Selector -->
      <div class="relative group flex items-center gap-2">
        <select v-model="selectedSheetKey" @change="onSheetChange"
          class="sheet-selector bg-transparent text-gray-200 text-xs sm:text-sm font-bold focus:outline-none cursor-pointer py-2 pr-6 sm:pr-8 pl-2 appearance-none hover:text-white active:scale-95 max-w-[150px] sm:max-w-[200px]">
          <option v-for="key in sheetKeys" :key="key" :value="key" class="bg-gray-800 text-white">
            {{ getAllSheets()[key]?.name || key }}
          </option>
        </select>
        <div class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
          <i class="fas fa-chevron-down text-xs"></i>
        </div>
        
        <!-- Delete Button (only for custom sheets) -->
        <button
          v-if="isCustomSheet(selectedSheetKey)"
          @click="deleteCustomSheet"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-600 hover:text-white transition-all text-red-400 active:scale-95"
          title="Delete this song"
        >
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="fixed w-full h-8 sm:h-6 cursor-pointer z-40 group hover:h-10 sm:hover:h-8 transition-all" :style="{ bottom: '28%' }"
      @click="onProgressBarClick" @mousemove="onProgressBarHover" @mouseleave="onProgressBarLeave">
      <!-- Track -->
      <div
        class="absolute top-1/2 left-0 w-full h-2 sm:h-1 bg-gray-700/50 group-hover:h-3 sm:group-hover:h-2 transition-all transform -translate-y-1/2 backdrop-blur-sm">
      </div>

      <!-- Progress Fill -->
      <div
        class="absolute top-1/2 left-0 h-2 sm:h-1 bg-gradient-to-r from-pink-500 to-purple-500 group-hover:h-3 sm:group-hover:h-2 transition-[height] transform -translate-y-1/2 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
        :style="{ width: `${progressPercentage}%` }">
        <!-- Throbber/Handle with Glow -->
        <div
          class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-4 h-4 sm:w-3 sm:h-3 bg-white rounded-full opacity-100 transition-all scale-100 group-hover:scale-150"
          style="box-shadow: 0 0 8px 2px rgba(236, 72, 153, 0.6), 0 0 16px 4px rgba(236, 72, 153, 0.4), 0 0 24px 6px rgba(236, 72, 153, 0.2), 0 0 32px 8px rgba(236, 72, 153, 0.1);">
        </div>
      </div>

      <!-- Timestamp Display (Current / Total) -->
      <div
        class="absolute top-0 right-4 transform -translate-y-full mb-2 bg-gray-900/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs sm:text-sm font-mono shadow-lg border border-gray-700">
        {{ formatTime(playbackTime) }} / {{ formatTime(totalDuration) }}
      </div>

      <!-- Hover Tooltip -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 scale-90 translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-90 translate-y-1">
        <div
          v-if="progressBarHoverTime !== null"
          class="absolute bottom-full mb-2 bg-gray-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-white text-xs font-mono shadow-xl border border-pink-500/50 pointer-events-none"
          :style="{ left: `${progressBarHoverX}px`, transform: 'translateX(-50%)' }">
          {{ formatTime(progressBarHoverTime) }}
          <!-- Arrow -->
          <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div class="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-500/50"></div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Debug Text -->
    <div v-if="debugText && !isPlaying"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 text-4xl sm:text-7xl font-bold z-0 pointer-events-none select-none tracking-widest whitespace-nowrap">
      {{ debugText }}
    </div>

    <!-- GitHub Link -->
    <a href="https://github.com/takosenpai2687/virtual-piano" target="_blank" rel="noopener noreferrer"
      class="github-link fixed top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-gray-900/60 backdrop-blur-md border border-gray-700 text-gray-300 hover:text-white transition-all z-50 group">
      <i class="fab fa-github text-xl"></i>
    </a>

    <!-- Rotate Phone Prompt (Portrait Mode on Mobile) -->
    <Transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-if="showRotatePrompt" class="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center">
        <div class="text-center px-8">
          <div class="rotate-phone-icon mb-8">
            <i class="fas fa-mobile-screen text-6xl text-white"></i>
          </div>
          <h2 class="text-3xl font-bold text-white mb-4">Rotate Your Device</h2>
          <p class="text-lg text-gray-300 mb-2">Please rotate your phone to landscape mode</p>
          <p class="text-sm text-gray-400">for the best piano experience</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Star Background Styles */
.stars-container {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #2a1a5e 0%, #4d2b8e 50%, #2a1a5e 100%);
  animation: starsBgHueRotate 8s ease-in-out infinite;
  z-index: 0;
  overflow: hidden;
}

.stars-box {
  position: absolute;
  width: 200%;
  height: 100%;
  left: 0;
}

.stars-box-duplicate {
  left: 100%;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
}

/* Stars Layer 1 - Small stars */
.stars-1 {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: 3201px 511px #fff, 2811px 119px #fff, 1086px 956px #fff, 2963px 1829px #fff, 3412px 1242px #fff, 490px 469px #fff, 2869px 425px #fff, 1447px 891px #fff, 3722px 1860px #fff, 517px 1895px #fff, 2338px 171px #fff, 1328px 1668px #fff, 2874px 1490px #fff, 1083px 81px #fff, 3632px 98px #fff, 1518px 1764px #fff, 3336px 596px #fff, 2178px 131px #fff, 2978px 1179px #fff, 1898px 1851px #fff, 3587px 326px #fff, 2186px 1588px #fff, 552px 1842px #fff, 1929px 1300px #fff, 3202px 681px #fff, 2430px 1711px #fff, 1192px 308px #fff, 3123px 1604px #fff, 2880px 169px #fff, 1400px 632px #fff, 3100px 1165px #fff, 288px 1208px #fff, 2319px 1418px #fff, 1170px 980px #fff, 3408px 784px #fff, 1735px 1276px #fff, 2966px 1534px #fff, 3654px 783px #fff, 1366px 964px #fff, 3213px 60px #fff, 302px 1509px #fff, 2845px 714px #fff, 3524px 323px #fff, 1538px 1399px #fff, 3394px 619px #fff, 680px 26px #fff, 2353px 776px #fff, 1826px 1450px #fff, 3109px 1452px #fff, 1014px 1315px #fff, 2683px 1474px #fff, 3766px 1742px #fff, 1693px 658px #fff, 3186px 302px #fff, 2376px 1575px #fff, 712px 1739px #fff, 2827px 299px #fff, 3482px 224px #fff, 1379px 510px #fff, 2543px 1602px #fff, 3045px 606px #fff, 827px 1336px #fff, 3224px 1839px #fff, 1098px 1342px #fff, 2813px 1553px #fff, 3625px 419px #fff, 519px 894px #fff, 2406px 797px #fff, 3341px 274px #fff, 1787px 903px #fff, 2901px 1483px #fff, 3108px 232px #fff, 1599px 1409px #fff, 2659px 870px #fff, 3538px 335px #fff, 632px 1855px #fff, 3154px 1026px #fff, 1722px 979px #fff, 2339px 509px #fff, 3634px 460px #fff, 2315px 65px #fff, 496px 1927px #fff, 3314px 427px #fff, 2344px 1046px #fff, 1658px 724px #fff, 2699px 264px #fff, 1200px 1305px #fff, 3562px 342px #fff, 2159px 766px #fff, 1639px 1862px #fff, 3461px 1898px #fff, 944px 763px #fff, 3174px 1056px #fff, 2625px 790px #fff, 906px 1524px #fff, 3537px 1300px #fff, 2079px 1106px #fff, 1316px 672px #fff, 3232px 61px #fff, 2709px 1076px #fff, 1010px 1814px #fff, 3773px 1160px #fff, 1598px 1427px #fff, 2815px 1172px #fff, 1005px 1158px #fff, 3676px 1003px #fff, 1025px 1529px #fff, 2066px 549px #fff, 3516px 457px #fff, 262px 1005px #fff, 2812px 1706px #fff, 1164px 1087px #fff, 3165px 45px #fff, 2677px 1462px #fff, 580px 1655px #fff, 3648px 1384px #fff, 2449px 1882px #fff, 1830px 1455px #fff, 2969px 488px #fff, 1188px 313px #fff, 3599px 1725px #fff, 2792px 311px #fff, 1927px 1933px #fff, 3422px 742px #fff, 98px 1635px #fff, 2888px 752px #fff, 3467px 118px #fff, 1896px 231px #fff, 3151px 320px #fff, 2307px 169px #fff, 3229px 229px #fff, 1357px 20px #fff, 2725px 1305px #fff, 3023px 1877px #fff, 426px 1945px #fff, 2628px 1530px #fff, 3256px 1295px #fff, 2058px 78px #fff, 409px 1145px #fff, 3607px 767px #fff, 2212px 144px #fff, 361px 1890px #fff, 2827px 1451px #fff, 3675px 645px #fff, 571px 853px #fff, 2302px 301px #fff, 3009px 1344px #fff, 418px 619px #fff, 3741px 90px #fff, 949px 640px #fff, 2179px 1783px #fff, 3104px 360px #fff, 1725px 370px #fff, 2122px 1418px #fff, 3374px 508px #fff, 1105px 1089px #fff, 2440px 1742px #fff, 3461px 1493px #fff, 1187px 265px #fff, 2567px 74px #fff, 3557px 542px #fff, 967px 673px #fff, 2825px 1970px #fff, 3588px 1260px #fff, 709px 1206px #fff, 2528px 1586px #fff, 3137px 854px #fff, 1922px 1312px #fff, 2481px 470px #fff, 3224px 316px #fff, 1979px 239px #fff, 3022px 1155px #fff, 1640px 186px #fff, 2592px 1709px #fff, 3765px 170px #fff, 129px 1750px #fff, 2789px 715px #fff, 3449px 806px #fff, 1398px 730px #fff, 2287px 1027px #fff, 3233px 297px #fff, 1598px 1587px #fff, 2918px 513px #fff, 3516px 336px #fff, 1572px 1007px #fff, 2534px 231px #fff, 3545px 972px #fff, 1970px 1413px #fff, 2285px 1079px #fff, 3748px 582px #fff, 2405px 186px #fff, 1739px 1386px #fff, 3253px 372px #fff, 520px 620px #fff, 2842px 852px #fff, 3490px 386px #fff, 1250px 143px #fff, 2813px 537px #fff, 3405px 614px #fff, 1236px 1186px #fff, 2287px 896px #fff, 3626px 990px #fff, 2031px 1067px #fff, 1288px 939px #fff, 2763px 338px #fff, 3713px 1515px #fff, 859px 1621px #fff, 2720px 1984px #fff, 3796px 1743px #fff, 1438px 1587px #fff, 2965px 412px #fff, 775px 1168px #fff, 3192px 956px #fff, 2368px 1075px #fff, 1485px 1154px #fff, 2875px 1772px #fff, 3515px 206px #fff, 1596px 1256px #fff, 2934px 1035px #fff, 3603px 1004px #fff, 1260px 433px #fff, 2926px 1988px #fff, 3667px 135px #fff, 2240px 53px #fff, 1919px 1832px #fff, 2696px 1384px #fff, 3630px 361px #fff, 878px 663px #fff, 2226px 1723px #fff, 3765px 686px #fff, 576px 1647px #fff, 2097px 1602px #fff, 3117px 1049px #fff, 1433px 68px #fff, 2375px 1991px #fff, 3755px 990px #fff, 1483px 801px #fff, 2473px 1802px #fff, 3822px 768px #fff, 196px 577px #fff, 2516px 504px #fff, 3623px 981px #fff, 1478px 819px #fff, 2126px 384px #fff, 3584px 1908px #fff, 1549px 521px #fff, 2866px 1335px #fff, 3586px 342px #fff, 1698px 642px #fff, 2136px 188px #fff, 3613px 520px #fff, 937px 326px #fff, 2111px 169px #fff;
  animation: animStar 50s linear infinite;
}

/* Stars Layer 2 - Medium stars */
.stars-2 {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 922px 1554px #fff, 1944px 550px #fff, 1696px 1632px #fff, 16px 1899px #fff, 1894px 130px #fff, 77px 262px #fff, 22px 1159px #fff, 933px 1206px #fff, 1660px 482px #fff, 1067px 1154px #fff, 468px 625px #fff, 1408px 1687px #fff, 153px 1200px #fff, 887px 1966px #fff, 1260px 514px #fff, 1167px 1158px #fff, 790px 553px #fff, 1103px 758px #fff, 226px 1028px #fff, 1340px 1760px #fff, 1712px 528px #fff, 114px 1693px #fff, 185px 572px #fff, 1566px 1793px #fff, 317px 1501px #fff, 846px 530px #fff, 1585px 1437px #fff, 1335px 1009px #fff, 1768px 436px #fff, 1131px 666px #fff, 27px 1543px #fff, 1778px 1861px #fff, 1496px 30px #fff, 1359px 1226px #fff, 416px 135px #fff, 1675px 673px #fff, 296px 524px #fff, 432px 1822px #fff, 1995px 416px #fff, 1206px 1846px #fff, 542px 603px #fff, 1811px 1083px #fff, 1125px 1900px #fff, 4px 1410px #fff, 665px 1674px #fff, 982px 365px #fff, 809px 534px #fff, 116px 1381px #fff, 727px 439px #fff, 1674px 1407px #fff, 976px 1762px #fff, 1585px 28px #fff, 1916px 624px #fff, 1716px 1118px #fff, 1022px 177px #fff, 807px 619px #fff, 1657px 338px #fff, 1608px 1259px #fff, 405px 1890px #fff, 433px 1978px #fff, 1457px 1495px #fff, 175px 990px #fff, 850px 1044px #fff, 170px 444px #fff, 1623px 71px #fff, 977px 1319px #fff, 440px 464px #fff, 51px 1209px #fff, 782px 1274px #fff, 1296px 244px #fff, 1260px 94px #fff, 652px 905px #fff, 805px 1307px #fff, 947px 822px #fff, 384px 268px #fff, 1856px 1782px #fff, 459px 1844px #fff, 1679px 473px #fff, 673px 1832px #fff, 96px 346px #fff, 1268px 428px #fff, 788px 1138px #fff, 1242px 867px #fff, 652px 831px #fff, 994px 1706px #fff, 1337px 64px #fff, 1092px 624px #fff, 674px 1344px #fff, 1036px 405px #fff, 996px 1371px #fff, 1906px 1410px #fff, 1285px 1079px #fff, 1756px 582px #fff, 404px 380px #fff, 1738px 1619px #fff, 1253px 372px #fff, 520px 620px #fff, 1842px 852px #fff, 490px 386px #fff, 1250px 143px #fff, 1813px 537px #fff, 1405px 614px #fff, 1236px 1186px #fff, 1287px 896px #fff, 1626px 990px #fff, 31px 1067px #fff, 1288px 939px #fff, 763px 338px #fff, 713px 1515px #fff, 859px 1621px #fff, 1720px 1984px #fff, 796px 1743px #fff, 1438px 1587px #fff, 965px 412px #fff, 775px 1168px #fff, 1192px 956px #fff, 368px 1075px #fff, 1485px 1154px #fff, 1664px 1733px #fff, 1939px 429px #fff, 1664px 92px #fff, 1806px 919px #fff, 1712px 494px #fff, 577px 1922px #fff, 820px 1228px #fff, 678px 1745px #fff, 1421px 586px #fff, 788px 208px #fff, 380px 250px #fff, 748px 977px #fff, 1637px 337px #fff, 851px 1514px #fff, 1487px 1410px #fff, 1776px 710px #fff, 544px 453px #fff, 1707px 1934px #fff, 1121px 1642px #fff, 1227px 391px #fff, 583px 833px #fff, 658px 278px #fff, 346px 1388px #fff, 1529px 1419px #fff, 233px 1008px #fff, 892px 943px #fff, 1431px 1091px #fff, 1524px 316px #fff, 1549px 192px #fff, 976px 36px #fff, 1648px 1053px #fff, 1834px 1572px #fff, 1677px 936px #fff, 589px 1755px #fff, 978px 1875px #fff, 1508px 412px #fff, 1242px 439px #fff, 1263px 40px #fff, 1427px 1736px #fff, 639px 906px #fff, 1349px 373px #fff, 1055px 969px #fff, 602px 95px #fff, 224px 1805px #fff, 1129px 837px #fff, 1110px 1358px #fff, 1067px 1752px #fff, 391px 1389px #fff, 885px 1979px #fff, 1188px 414px #fff, 1931px 325px #fff, 1853px 1918px #fff, 636px 1313px #fff, 1236px 1913px #fff, 1801px 780px #fff, 633px 529px #fff, 1500px 33px #fff, 1387px 1045px #fff, 832px 1281px #fff, 1880px 1845px #fff, 1477px 1096px #fff, 1457px 698px #fff, 1658px 1049px #fff, 1957px 1151px #fff, 1561px 1593px #fff, 627px 250px #fff, 975px 1575px #fff, 68px 998px #fff, 951px 85px #fff, 280px 431px #fff, 1683px 1745px #fff, 322px 778px #fff, 842px 888px #fff, 1895px 1883px #fff, 700px 568px #fff, 1846px 442px #fff, 91px 1650px #fff, 970px 917px #fff, 1585px 452px #fff;
  animation: animStar 100s linear infinite;
}

/* Stars Layer 3 - Large stars */
.stars-3 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 1679px 1408px #fff, 1970px 1504px #fff, 1789px 965px #fff, 698px 234px #fff, 1733px 1854px #fff, 1060px 271px #fff, 719px 1744px #fff, 1707px 1847px #fff, 1710px 432px #fff, 1325px 1585px #fff, 92px 577px #fff, 163px 1939px #fff, 1885px 123px #fff, 1566px 1753px #fff, 1288px 21px #fff, 1396px 1908px #fff, 675px 1466px #fff, 734px 1557px #fff, 941px 1885px #fff, 1692px 6px #fff, 115px 1183px #fff, 639px 1044px #fff, 1171px 1982px #fff, 1801px 1078px #fff, 648px 820px #fff, 1885px 1984px #fff, 268px 1729px #fff, 1388px 181px #fff, 1741px 1280px #fff, 1719px 1080px #fff, 12px 932px #fff, 489px 157px #fff, 1910px 790px #fff, 115px 44px #fff, 1748px 1458px #fff, 282px 109px #fff, 1100px 1528px #fff, 543px 598px #fff, 1320px 1188px #fff, 1124px 839px #fff, 1406px 1289px #fff, 472px 1376px #fff, 852px 286px #fff, 510px 860px #fff, 700px 306px #fff, 1822px 1302px #fff, 15px 19px #fff, 1360px 420px #fff, 1483px 42px #fff, 1287px 1867px #fff, 1105px 1322px #fff, 745px 161px #fff, 431px 1722px #fff, 855px 1254px #fff, 860px 1784px #fff, 1578px 1955px #fff, 1085px 461px #fff, 472px 690px #fff, 23px 1152px #fff, 1625px 601px #fff, 1177px 1692px #fff, 397px 1984px #fff, 10px 1164px #fff, 1132px 1557px #fff, 438px 817px #fff, 1590px 1236px #fff, 1037px 1616px #fff, 533px 942px #fff, 1163px 1992px #fff, 1451px 1081px #fff, 1335px 1572px #fff, 503px 1556px #fff, 197px 1725px #fff, 511px 1397px #fff, 1514px 1164px #fff, 1249px 148px #fff, 947px 1849px #fff, 1258px 1426px #fff, 255px 1937px #fff, 23px 529px #fff, 578px 230px #fff, 925px 767px #fff, 903px 365px #fff, 1861px 450px #fff, 1813px 912px #fff, 1597px 637px #fff, 195px 626px #fff, 130px 404px #fff, 725px 408px #fff, 1916px 843px #fff, 1336px 239px #fff, 1568px 1390px #fff, 139px 126px #fff, 1287px 1271px #fff, 731px 465px #fff, 1959px 1465px #fff, 909px 169px #fff, 838px 1332px #fff, 464px 1037px #fff, 1893px 233px #fff;
  animation: animStar 150s linear infinite;
}

/* Fog Layer */
.fog-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url('/src/assets/fog.png');
  background-size: 2400px 1440px;
  animation: fogMove 60s linear infinite;
  opacity: 0.4;
  mix-blend-mode: screen;
  top: 0;
  left: 0;
}

/* Horizon Glow */
.horizon-glow {
  position: absolute;
  width: 100%;
  height: 30%;
  background: linear-gradient(0deg,
      rgba(0, 0, 0, 0),
      rgba(138, 43, 226, 0.3),
      rgba(0, 0, 0, 0));
  opacity: 0.6;
  left: 0;
  bottom: 80px;
  pointer-events: none;
}

/* Animations */
@keyframes animStar {
  from {
    transform: translateX(0px);
  }

  to {
    transform: translateX(-4000px);
  }
}

@keyframes fogMove {
  0% {
    background-position: 2400px 1440px;
  }

  100% {
    background-position: 0 0;
  }
}

@keyframes starsBgHueRotate {
  0% {
    filter: hue-rotate(0deg) brightness(0.7);
  }

  25% {
    filter: hue-rotate(45deg) brightness(0.75);
  }

  50% {
    filter: hue-rotate(0deg) brightness(0.8);
  }

  75% {
    filter: hue-rotate(-45deg) brightness(0.75);
  }

  100% {
    filter: hue-rotate(0deg) brightness(0.7);
  }
}

/* GitHub Link Styles */
.github-link {
  transition: all 0.3s ease;
}

.github-link:hover {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px) brightness(1.2);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.4),
              0 0 40px rgba(255, 255, 255, 0.2),
              inset 0 0 20px rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.4);
}

.github-link:active {
  transform: scale(0.95);
}

/* Rotate Phone Prompt Animation */
.rotate-phone-icon {
  animation: rotatePhone 2s ease-in-out infinite;
}

@keyframes rotatePhone {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-90deg) scale(1.1);
  }
  50% {
    transform: rotate(-90deg);
  }
  75% {
    transform: rotate(-90deg) scale(1.1);
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { PianoEngine, toneAudio } from '@/services/pianoEngine';
import { sheets, getSheetNames, reloadSheets, getAllSheets, loadDefaultSheets } from '@/data/sheets';
import MidiUploader from './MidiUploader.vue';
import * as Tone from 'tone';

import type { MidiNote, KeyboardRect, Bubble } from '@/types/piano';
import {
  BG_COLOR,
  WHITE,
  BLACK,
  KB_FONT,
  KB_FONT_SIZE,
  SHADOW_BLUR,
  COLOR_WHEEL
} from '@/types/piano';

// ========================================
// COLOR CONFIGURATION
// Easily customize colors here by changing the hex color codes
// Examples:
//   - Red: '#FF0000'
//   - Blue: '#0000FF'
//   - Green: '#00FF00'
//   - Cyan: '#00FFFF'
//   - Pink: '#FF1493'
//   - Orange: '#FF6B35'
// ========================================
const PIANO_KEYDOWN_COLOR_TOP = '#F50057';
const PIANO_KEYDOWN_COLOR_BOT = '#C2185B';
const WAVE_COLOR = '#F50057'; // Wave border color (Cyan)
const NOTE_DURATION_MULTIPLIER = 1.67; // Multiplier for note sustain duration (1.67 = 67% longer)

const canvasRef = ref<HTMLCanvasElement | null>(null);
const waveCanvasRef = ref<HTMLCanvasElement | null>(null);
const selectedSheetKey = ref<string>('unravel___animenz');
const isPlaying = ref(false);
const debugText = ref('PRESS PLAY BUTTON OR SPACE');
const customSheet = ref<{ name: string; notes: MidiNote[] } | null>(null);
const playbackTime = ref(0); // Single source of truth: current time in song (ms)
const totalDuration = ref(1000); // Total song duration in ms
const playbackSpeed = ref(1); // Speed multiplier
const volume = ref(0.9); // Volume level 0-1
const showVolumeSlider = ref(false); // Toggle volume slider visibility
const canvasWidth = ref(window.innerWidth);
const canvasHeight = ref(window.innerHeight);
const pianoY = ref(0);
const progressBarHoverTime = ref<number | null>(null); // Timestamp at hover position
const progressBarHoverX = ref(0); // X position for hover tooltip

const sheetKeys = ref(getSheetNames());
const currentSheet = computed(() => {
  if (customSheet.value) return customSheet.value;
  const allSheets = getAllSheets();
  return allSheets[selectedSheetKey.value];
});

const progressPercentage = computed(() => {
  if (totalDuration.value === 0) return 0;
  return Math.min(100, Math.max(0, (playbackTime.value / totalDuration.value) * 100));
});

const volumeIcon = computed(() => {
  if (volume.value === 0) return 'fa-volume-off';
  if (volume.value < 0.33) return 'fa-volume-down';
  if (volume.value < 0.66) return 'fa-volume-down';
  return 'fa-volume-up';
});

const isMobile = computed(() => {
  // Check if device has touch capability and is a mobile/tablet device
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check if the smaller dimension (portrait or landscape) is less than 768px
  // This ensures we detect mobile in both orientations
  const minDimension = Math.min(canvasWidth.value, canvasHeight.value);
  const isMobileSize = minDimension < 768;
  
  // Also check user agent for mobile indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Device is mobile if it has a mobile user agent OR (has touch and small screen)
  return isMobileUserAgent || (hasTouchScreen && isMobileSize);
});

const showRotatePrompt = computed(() => {
  // Show prompt when on mobile device in portrait mode (height > width)
  return isMobile.value && canvasHeight.value > canvasWidth.value;
});

const isLandscapeMobile = computed(() => {
  // Detect mobile device in landscape orientation
  return isMobile.value && canvasWidth.value > canvasHeight.value;
});

const shouldThinBubbles = computed(() => {
  // Only thin bubbles on very narrow screens or mobile in portrait
  // In landscape mode on mobile, use normal bubble width
  return canvasWidth.value < 768 || (isMobile.value && canvasHeight.value > canvasWidth.value);
});

let ctx: CanvasRenderingContext2D | null = null;
let engine: PianoEngine;
let keyboardRects: KeyboardRect[] = [];
let midiNotes: MidiNote[] = [];
let lastFrameTime = 0;
let animationFrameId: number;
let isMouseDown = false;
let mousePressedKey: number | null = null;
let cachedWhiteKeyWidth = 0;
let cachedBlackKeyWidth = 0;
let cachedBubbleWidth = 0;
let activeNoteTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map(); // Track active note release timeouts
let manualReleaseTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map(); // Track manual note release delays
let smokeParticles: Array<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}> = [];

let sparkParticles: Array<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  brightness: number;
}> = [];

let keyGlowEffects: Map<number, { intensity: number; color: string; time: number }> = new Map();

// Background effects
let backgroundWaves: Array<{
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  speed: number;
}> = [];

let floatingParticles: Array<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulsePhase: number;
}> = [];

let musicReactiveGlow = { intensity: 0, color: '#4f46e5' };
let lastNoteTime = 0;

const onSheetChange = () => {
  customSheet.value = null;
  // Save the selected sheet to localStorage
  localStorage.setItem('selectedSheetKey', selectedSheetKey.value);
  reset();
};

const onNotesConverted = (notes: MidiNote[], fileName: string, autoPlay?: boolean) => {
  // Generate a unique key for this custom sheet
  const sheetKey = `custom_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  customSheet.value = {
    name: fileName,
    notes: notes
  };
  
  // Update selected sheet key to show it in the dropdown
  selectedSheetKey.value = sheetKey;
  // Save the selected sheet to localStorage
  localStorage.setItem('selectedSheetKey', sheetKey);
  
  reset();
  
  // Auto-play if requested
  if (autoPlay) {
    // Small delay to ensure everything is initialized
    setTimeout(() => {
      play();
    }, 100);
  }
};

const onSheetSaved = () => {
  // Reload sheets from localStorage
  reloadSheets();
  sheetKeys.value = getSheetNames();
};

const loadSavedSelection = () => {
  try {
    const savedKey = localStorage.getItem('selectedSheetKey');
    if (savedKey && sheetKeys.value.includes(savedKey)) {
      // Saved selection exists, use it
      selectedSheetKey.value = savedKey;
    } else {
      // No saved selection - use Unravel as default if it exists, otherwise first available
      const defaultKey = 'unravel___animenz';
      if (sheetKeys.value.includes(defaultKey)) {
        selectedSheetKey.value = defaultKey;
      } else {
        selectedSheetKey.value = sheetKeys.value[0] || defaultKey;
      }
      // Update localStorage with the selection
      localStorage.setItem('selectedSheetKey', selectedSheetKey.value);
    }
  } catch (err) {
    console.error('Failed to load saved selection:', err);
    selectedSheetKey.value = 'unravel___animenz';
  }
};

const isCustomSheet = (key: string): boolean => {
  return key.startsWith('custom_');
};

const deleteCustomSheet = () => {
  const currentKey = selectedSheetKey.value;
  
  if (!isCustomSheet(currentKey)) {
    return;
  }
  
  try {
    // Get existing saved sheets from localStorage
    const savedSheetsJson = localStorage.getItem('customSheets');
    const savedSheets = savedSheetsJson ? JSON.parse(savedSheetsJson) : {};
    
    // Delete the sheet
    delete savedSheets[currentKey];
    
    // Save back to localStorage
    localStorage.setItem('customSheets', JSON.stringify(savedSheets));
    
    // Reload sheets
    reloadSheets();
    sheetKeys.value = getSheetNames();
    
    // Find the next sheet to switch to
    const currentIndex = sheetKeys.value.indexOf(currentKey);
    let nextKey: string;
    
    if (currentIndex < sheetKeys.value.length - 1) {
      // Switch to the next sheet
      nextKey = sheetKeys.value[currentIndex + 1];
    } else {
      // We're at the end, switch to the first sheet
      nextKey = sheetKeys.value[0];
    }
    
    // Update selection and reset
    selectedSheetKey.value = nextKey;
    // Save the new selection to localStorage
    localStorage.setItem('selectedSheetKey', nextKey);
    customSheet.value = null;
    reset();
  } catch (err) {
    console.error('Failed to delete sheet:', err);
  }
};

const cycleSpeed = () => {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const currentIndex = speeds.indexOf(playbackSpeed.value);
  const nextIndex = (currentIndex + 1) % speeds.length;
  playbackSpeed.value = speeds[nextIndex];
};

const updateVolume = () => {
  // Update Tone.js master volume
  // Tone.js volume is in decibels: -60 dB (silent) to 0 dB (full)
  // Convert 0-1 linear scale to -60 to 0 dB logarithmic scale
  if (volume.value === 0) {
    Tone.Destination.volume.value = -Infinity;
  } else {
    const dbValue = -60 + (volume.value * 60);
    Tone.Destination.volume.value = dbValue;
  }
};

const calcTotalDuration = () => {
  if (!midiNotes.length) {
    totalDuration.value = 1000;
    return;
  }
  const lastNote = midiNotes[midiNotes.length - 1];
  // Total duration is when last note ends
  totalDuration.value = lastNote.TimeMs + lastNote.DurationMs;
};

const reset = () => {
  isPlaying.value = false;
  playbackTime.value = 0;
  lastFrameTime = 0;
  engine.clearCurrentKeys();

  // Clear all active note timeouts
  activeNoteTimeouts.forEach(timeout => clearTimeout(timeout));
  activeNoteTimeouts.clear();
  
  // Clear all manual release timeouts
  manualReleaseTimeouts.forEach(timeout => clearTimeout(timeout));
  manualReleaseTimeouts.clear();

  initSheet();
};

const stop = () => {
  pause();
  reset();
};

const initSheet = () => {
  if (!currentSheet.value) return;

  // Use original MIDI velocities without normalization
  midiNotes = [...currentSheet.value.notes];
  // Sort notes by time
  midiNotes.sort((a, b) => a.TimeMs - b.TimeMs);

  calcTotalDuration();
};

const togglePlayPause = () => {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
};

const play = async () => {
  // CRITICAL: Start and WAIT for audio context on user interaction
  try {
    await toneAudio.startAudioContext();
    console.log('Audio context fully started, state:', Tone.context.state);
  } catch (err) {
    console.error('Failed to start audio context:', err);
    return; // Don't start playback if audio failed
  }
  
  if (playbackTime.value >= totalDuration.value) {
    playbackTime.value = 0;
  }
  debugText.value = '';
  isPlaying.value = true;
  lastFrameTime = performance.now();
};

const pause = () => {
  debugText.value = 'PAUSED';
  isPlaying.value = false;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const seek = (offsetMs: number) => {
  setTime(playbackTime.value + offsetMs);
};

const onProgressBarClick = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  const percentage = Math.max(0, Math.min(1, clickX / width));

  const newTime = percentage * totalDuration.value;
  setTime(newTime);
};

const onProgressBarHover = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const hoverX = e.clientX - rect.left;
  const width = rect.width;
  const percentage = Math.max(0, Math.min(1, hoverX / width));
  
  progressBarHoverTime.value = percentage * totalDuration.value;
  progressBarHoverX.value = e.clientX;
};

const onProgressBarLeave = () => {
  progressBarHoverTime.value = null;
};

const setTime = (timeMs: number) => {
  // Clamp to valid range
  timeMs = Math.max(0, Math.min(timeMs, totalDuration.value));

  // Clear all currently playing notes and their timeouts
  engine.clearCurrentKeys();
  activeNoteTimeouts.forEach(timeout => clearTimeout(timeout));
  activeNoteTimeouts.clear();
  
  // Clear all manual release timeouts
  manualReleaseTimeouts.forEach(timeout => clearTimeout(timeout));
  manualReleaseTimeouts.clear();

  // Update playback time immediately
  playbackTime.value = timeMs;
  // Reset frame time so next frame starts fresh
  lastFrameTime = 0;
};

const onMouseDown = (e: MouseEvent | TouchEvent) => {
  if (!ctx || !canvasRef.value) return;

  // Prevent default touch behavior (scrolling, zooming)
  if ('touches' in e) {
    e.preventDefault();
  }

  const rect = canvasRef.value.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let midiKey: number | null | undefined = null;
  const blackKey = keyboardRects.find(r => r.isBlack &&
    x >= r.x && x <= r.x + r.width &&
    y >= r.y && y <= r.y + r.height
  );

  if (blackKey) {
    midiKey = blackKey.index + 36;
  } else {
    midiKey = engine.resolveKeyByMouse(x, y, keyboardRects);
  }

  if (!midiKey) return;

  isMouseDown = true;
  const currentKeys = engine.getCurrentKeys();

  if (currentKeys.length > 0 && currentKeys.includes(midiKey)) {
    engine.playSound(midiKey, 127);
    mousePressedKey = midiKey;
    triggerManualPlayEffects(midiKey); // Add effects
    return;
  }

  engine.addCurrentKey(midiKey);
  mousePressedKey = midiKey;
  engine.playSound(midiKey, 127);
  triggerManualPlayEffects(midiKey); // Add effects
};

const onMouseMove = (e: MouseEvent | TouchEvent) => {
  if (!isMouseDown || !canvasRef.value) return;

  // Prevent default touch behavior (scrolling)
  if ('touches' in e) {
    e.preventDefault();
  }

  const rect = canvasRef.value.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let midiKey: number | null | undefined = null;
  const blackKey = keyboardRects.find(r => r.isBlack &&
    x >= r.x && x <= r.x + r.width &&
    y >= r.y && y <= r.y + r.height
  );

  if (blackKey) {
    midiKey = blackKey.index + 36;
  } else {
    midiKey = engine.resolveKeyByMouse(x, y, keyboardRects);
  }

  if (!midiKey) return;

  if (mousePressedKey !== null && midiKey && midiKey !== mousePressedKey) {
    // Remove visual immediately for the previous key
    engine.removeCurrentKeyVisual(mousePressedKey);
    
    // Schedule delayed audio release for the previous key with sustain
    const releaseDelay = 200;
    const keyToRelease = mousePressedKey;
    
    // Clear any existing timeout for this key
    if (manualReleaseTimeouts.has(keyToRelease)) {
      clearTimeout(manualReleaseTimeouts.get(keyToRelease)!);
    }
    
    const timeout = setTimeout(() => {
      toneAudio.releaseNote(keyToRelease);
      manualReleaseTimeouts.delete(keyToRelease);
    }, releaseDelay);
    
    manualReleaseTimeouts.set(keyToRelease, timeout);
    
    // Start new key immediately
    mousePressedKey = midiKey;
    engine.addCurrentKey(midiKey);
    engine.getCurrentKeys().forEach(mk => engine.playSound(mk, 127));
    triggerManualPlayEffects(midiKey); // Add effects
  }
};

const onMouseUp = () => {
  if (mousePressedKey !== null) {
    // Remove visual immediately for instant feedback
    engine.removeCurrentKeyVisual(mousePressedKey);
    
    // Apply 167% sustain delay for audio only
    const releaseDelay = 300 * NOTE_DURATION_MULTIPLIER; // Base duration of 300ms with multiplier
    
    // Clear any existing timeout for this key
    if (manualReleaseTimeouts.has(mousePressedKey)) {
      clearTimeout(manualReleaseTimeouts.get(mousePressedKey)!);
    }
    
    const keyToRelease = mousePressedKey;
    const timeout = setTimeout(() => {
      toneAudio.releaseNote(keyToRelease);
      manualReleaseTimeouts.delete(keyToRelease);
    }, releaseDelay);
    
    manualReleaseTimeouts.set(mousePressedKey, timeout);
    mousePressedKey = null;
  }
  isMouseDown = false;
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
    return;
  }

  if (e.repeat) return;

  const midiKey = engine.resolveKeyByKeyboard(e.key, e.shiftKey);
  if (!midiKey) return;

  if (!engine.getCurrentKeys().includes(midiKey)) {
    engine.addCurrentKey(midiKey);
    engine.playSound(midiKey, 127);
    triggerManualPlayEffects(midiKey); // Add effects
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') return;

  const midiKeyReleased = engine.resolveKeyByKeyboard(e.key, e.shiftKey);
  if (!midiKeyReleased) return;

  // Remove visual immediately for instant feedback
  engine.removeCurrentKeyVisual(midiKeyReleased);

  // Apply 167% sustain delay for audio only
  const releaseDelay = 300 * NOTE_DURATION_MULTIPLIER; // Base duration of 300ms with multiplier
  
  // Clear any existing timeout for this key
  if (manualReleaseTimeouts.has(midiKeyReleased)) {
    clearTimeout(manualReleaseTimeouts.get(midiKeyReleased)!);
  }
  
  const timeout = setTimeout(() => {
    toneAudio.releaseNote(midiKeyReleased);
    manualReleaseTimeouts.delete(midiKeyReleased);
  }, releaseDelay);
  
  manualReleaseTimeouts.set(midiKeyReleased, timeout);
};

const playNotesInTimeRange = (fromTime: number, toTime: number) => {
  // Find and play all notes that should trigger in this time range
  for (const note of midiNotes) {
    const noteStartTime = note.TimeMs;
    const noteEndTime = note.TimeMs + note.DurationMs;

    // Skip notes that haven't started yet
    if (noteStartTime > toTime) break;

    // Skip notes that already finished before this range
    if (noteEndTime < fromTime) continue;

    // If note starts within this time range, trigger it
    if (noteStartTime >= fromTime && noteStartTime < toTime) {
      const midiKey = note.Key;
      const vel = note.Vel || 127;

      // Calculate the delay before playing this note
      // The note should play at (noteStartTime - playbackTime.value) from now
      const delayMs = Math.max(0, (noteStartTime - fromTime) / playbackSpeed.value);

      // Schedule the note to play at the correct time
      setTimeout(() => {
        engine.addCurrentKey(midiKey);
        engine.playSound(midiKey, vel);

        // Schedule note release with duration multiplier for better sustain
        const adjustedDuration = (note.DurationMs * NOTE_DURATION_MULTIPLIER) / playbackSpeed.value;
        const timeout = setTimeout(() => {
          engine.removeCurrentKey(midiKey);
          engine.setKeyVolume(midiKey, 1.0);
          activeNoteTimeouts.delete(midiKey);
        }, adjustedDuration - 10);

        // Clear any existing timeout for this key
        if (activeNoteTimeouts.has(midiKey)) {
          clearTimeout(activeNoteTimeouts.get(midiKey)!);
        }
        activeNoteTimeouts.set(midiKey, timeout);
      }, delayMs);
    }
  }
};

const calculateBubbles = (): Bubble[] => {
  if (!canvasRef.value) return [];

  const pianoY = canvasRef.value.height * 0.73;
  const bubbles: Bubble[] = [];
  const bubbleWidth = cachedBubbleWidth;
  const currentTime = playbackTime.value;

  // Calculate visible time window for early exit optimization
  const minVisibleTime = currentTime - canvasRef.value.height;
  const maxVisibleTime = currentTime + pianoY;

  for (const note of midiNotes) {
    // Early exit if note hasn't started yet (notes are sorted by time)
    if (note.TimeMs > maxVisibleTime) break;
    
    // Skip notes that have already passed
    if (note.TimeMs + note.DurationMs < minVisibleTime) continue;
    const midiKey = note.Key;
    const keyIndex = midiKey - 36;

    // Find the keyboard rect for this key
    const keyRect = keyboardRects[keyIndex];
    if (!keyRect) continue;

    // Bubble dimensions (height = duration in pixels)
    const height = note.DurationMs;

    // Calculate bubble bottom Y position
    // The BOTTOM of the bubble should reach pianoY exactly at note.TimeMs
    // Bubble moves at 1 pixel per millisecond
    // Bottom position: y + height = pianoY at time = note.TimeMs
    // So: y + height = playbackTime.value - note.TimeMs + pianoY
    // Therefore: y = playbackTime.value - note.TimeMs + pianoY - height
    const bottomY = pianoY - (note.TimeMs - playbackTime.value);
    const y = bottomY - height;

    // Skip bubbles that haven't appeared yet (still above screen)
    if (bottomY < 0) continue;

    // Skip bubbles that have already passed the piano line
    if (y > pianoY) continue;

    // Cache color to avoid redundant calculation
    const color = COLOR_WHEEL[midiKey % COLOR_WHEEL.length];
    
    // Check if bubble is touching the keyboard and create effects
    if (bottomY >= pianoY - 5 && bottomY <= pianoY + 5) {
      const x = keyRect.x + keyRect.width / 2 - bubbleWidth / 2;

      // Create smoke particles occasionally
      if (Math.random() > 0.7) {
        createSmokeParticles(x + bubbleWidth / 2, pianoY, color);
      }

      // Create electric sparks when hitting
      if (Math.random() > 0.6) {
        createElectricSparks(x + bubbleWidth / 2, pianoY, color, bubbleWidth);
      }

      // Add key glow effect
      keyGlowEffects.set(keyIndex, { intensity: 1, color: color, time: 0 });
    }

    // Position bubble centered on key
    const x = keyRect.x + keyRect.width / 2 - bubbleWidth / 2;

    bubbles.push({
      x,
      y,
      width: bubbleWidth,
      height,
      color,
      keyboardRectIndex: keyIndex
    });
  }

  return bubbles;
};

const createBackgroundWave = (x: number, y: number, color: string) => {
  backgroundWaves.push({
    x: x,
    y: y,
    radius: 0,
    maxRadius: Math.random() * 200 + 150,
    alpha: 0.3,
    color: color,
    speed: Math.random() * 2 + 1
  });
};

const triggerManualPlayEffects = (midiKey: number) => {
  const keyIndex = midiKey - 36;
  const keyRect = keyboardRects[keyIndex];
  if (!keyRect) return;

  const color = COLOR_WHEEL[midiKey % COLOR_WHEEL.length];
  const bubbleWidth = cachedBubbleWidth;
  
  const x = keyRect.x + keyRect.width / 2;
  const y = pianoY.value;

  // Create smoke particles
  if (Math.random() > 0.5) {
    createSmokeParticles(x, y, color);
  }

  // Create electric sparks
  if (Math.random() > 0.4) {
    createElectricSparks(x, y, color, bubbleWidth);
  }

  // Add key glow effect
  keyGlowEffects.set(keyIndex, { intensity: 1, color: color, time: 0 });
};

const initFloatingParticles = () => {
  const count = 18; // Increased from 15 (20% more)
  floatingParticles = [];
  for (let i = 0; i < count; i++) {
    floatingParticles.push({
      x: Math.random() * canvasWidth.value,
      y: Math.random() * canvasHeight.value,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.3 + 0.1,
      baseAlpha: Math.random() * 0.3 + 0.1,
      color: COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)],
      pulsePhase: Math.random() * Math.PI * 2
    });
  }
};

const updateBackgroundWaves = (dt: number) => {
  backgroundWaves = backgroundWaves.filter(wave => {
    wave.radius += wave.speed * dt * 0.1;
    wave.alpha = Math.max(0, 0.3 * (1 - wave.radius / wave.maxRadius));
    return wave.radius < wave.maxRadius;
  });
};

const updateFloatingParticles = (dt: number) => {
  floatingParticles.forEach(particle => {
    particle.x += particle.vx * dt * 0.05;
    particle.y += particle.vy * dt * 0.05;

    // Wrap around screen
    if (particle.x < 0) particle.x = canvasWidth.value;
    if (particle.x > canvasWidth.value) particle.x = 0;
    if (particle.y < 0) particle.y = canvasHeight.value;
    if (particle.y > canvasHeight.value) particle.y = 0;

    // Gentle pulsing effect
    particle.pulsePhase += dt * 0.003;
    particle.alpha = particle.baseAlpha * (0.7 + 0.3 * Math.sin(particle.pulsePhase));

    // React to music
    if (musicReactiveGlow.intensity > 0) {
      particle.alpha = Math.min(1, particle.alpha + musicReactiveGlow.intensity * 0.4);
      particle.size = Math.min(6, particle.size * (1 + musicReactiveGlow.intensity * 0.3));
    }
  });
};

const updateMusicReactiveEffects = (dt: number) => {
  // Decay reactive glow
  musicReactiveGlow.intensity = Math.max(0, musicReactiveGlow.intensity - dt * 0.005);

  // Reset particle sizes
  floatingParticles.forEach(particle => {
    if (particle.size > 4) {
      particle.size = Math.max(1, particle.size * 0.98);
    }
  });
};

const createSmokeParticles = (x: number, y: number, color: string) => {
  // Create 2-3 smoke particles
  const count = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < count; i++) {
    smokeParticles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.8 - 0.3,
      life: 1,
      maxLife: Math.random() * 300 + 200,
      size: Math.random() * 8 + 4,
      color: color,
      alpha: 0.6
    });
  }
};

const createElectricSparks = (x: number, y: number, color: string, width: number) => {
  // Trigger music reactive effects
  musicReactiveGlow.intensity = Math.min(1, musicReactiveGlow.intensity + 0.6);
  musicReactiveGlow.color = color;
  lastNoteTime = performance.now();

  // Create background wave occasionally
  if (Math.random() > 0.7) {
    createBackgroundWave(x, y - 50, color);
  }

  // Create 8-12 electric spark particles
  const count = Math.floor(Math.random() * 5) + 8;
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI) - Math.PI / 2; // Upward hemisphere
    const speed = Math.random() * 1.5 + 0.5;
    sparkParticles.push({
      x: x + (Math.random() - 0.5) * width,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: Math.random() * 200 + 150,
      size: Math.random() * 3 + 2,
      color: color,
      alpha: 1,
      brightness: Math.random() * 0.5 + 0.5
    });
  }
};

const updateSmokeParticles = (dt: number) => {
  smokeParticles = smokeParticles.filter(p => {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.001 * dt; // slight gravity
    p.alpha = Math.max(0, 0.6 * (1 - p.life / p.maxLife));
    p.size += 0.02 * dt; // grow slightly
    return p.life < p.maxLife;
  });
};

const updateSparkParticles = (dt: number) => {
  sparkParticles = sparkParticles.filter(p => {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.003 * dt; // gravity
    p.vx *= 0.98; // air resistance
    p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
    return p.life < p.maxLife;
  });
};

const updateKeyGlowEffects = (dt: number) => {
  keyGlowEffects.forEach((effect, key) => {
    effect.time += dt;
    effect.intensity = Math.max(0, 1 - (effect.time / 300)); // Fade over 300ms
    if (effect.intensity <= 0) {
      keyGlowEffects.delete(key);
    }
  });
};

const drawBackgroundEffects = () => {
  if (!ctx) return;

  // Draw floating particles - batch save/restore for all particles
  if (floatingParticles.length > 0) {
    ctx.save();
    floatingParticles.forEach(particle => {
      ctx!.globalAlpha = particle.alpha;
      ctx!.fillStyle = particle.color;
      ctx!.shadowColor = particle.color;
      ctx!.shadowBlur = 8;
      ctx!.beginPath();
      ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx!.fill();
    });
    ctx.restore();
  }

  // Draw background waves - batch save/restore for all waves
  if (backgroundWaves.length > 0) {
    ctx.save();
    ctx.lineWidth = 2;
    backgroundWaves.forEach(wave => {
      ctx!.globalAlpha = wave.alpha;
      ctx!.strokeStyle = wave.color;
      ctx!.shadowColor = wave.color;
      ctx!.shadowBlur = 15;
      ctx!.beginPath();
      ctx!.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx!.stroke();
    });
    ctx.restore();
  }

  // Draw subtle background gradient that reacts to music
  if (musicReactiveGlow.intensity > 0.1) {
    const centerX = canvasWidth.value / 2;
    const centerY = canvasHeight.value * 0.4;
    const gradient = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, 600);

    const alpha0 = (musicReactiveGlow.intensity * 40) | 0;
    const alpha1 = (musicReactiveGlow.intensity * 20) | 0;
    gradient.addColorStop(0, `${musicReactiveGlow.color}${alpha0.toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `${musicReactiveGlow.color}${alpha1.toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'transparent');

    ctx!.save();
    ctx!.fillStyle = gradient;
    ctx!.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
    ctx!.restore();
  }
};

const drawSmokeParticles = () => {
  if (!ctx || smokeParticles.length === 0) return;

  ctx.save();
  smokeParticles.forEach(p => {
    ctx!.globalAlpha = p.alpha;
    ctx!.fillStyle = p.color;
    ctx!.shadowColor = p.color;
    ctx!.shadowBlur = 15;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx!.fill();
  });
  ctx.restore();
};

const drawSparkParticles = () => {
  if (!ctx || sparkParticles.length === 0) return;

  ctx.save();
  sparkParticles.forEach(p => {
    ctx!.globalAlpha = p.alpha;

    // Draw bright core
    ctx!.fillStyle = '#ffffff';
    ctx!.shadowColor = p.color;
    ctx!.shadowBlur = 20 * p.brightness;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    ctx!.fill();

    // Draw colored glow
    ctx!.fillStyle = p.color;
    ctx!.shadowBlur = 15 * p.brightness;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx!.fill();
  });
  ctx.restore();
};

const drawKey = (r: KeyboardRect, currentKeysSet: Set<number>) => {
  if (!ctx) return;

  const isKeyDown = currentKeysSet.has(r.index + 36);
  const glowEffect = keyGlowEffects.get(r.index);

  // Apply pressed-in effect with inset shadow and slight size reduction
  let offsetX = 0;
  let offsetY = 0;
  let widthReduction = 0;
  let heightReduction = 0;
  
  if (isKeyDown) {
    // Make key appear pressed in
    offsetY = r.height * 0.03; // Push down slightly
    heightReduction = r.height * 0.03; // Make slightly shorter
    if (r.isBlack) {
      widthReduction = r.width * 0.02; // Slight width reduction for black keys
      offsetX = widthReduction / 2; // Center the reduction
    }
  }

  const adjustedRect = {
    x: r.x + offsetX,
    y: r.y + offsetY,
    width: r.width - widthReduction,
    height: r.height - heightReduction
  };

  if (isKeyDown) {
    // Use darker gradient for pressed key with inset shadow effect
    const gradient = ctx.createLinearGradient(adjustedRect.x, adjustedRect.y, adjustedRect.x, adjustedRect.y + adjustedRect.height);
    gradient.addColorStop(0, PIANO_KEYDOWN_COLOR_TOP);
    gradient.addColorStop(1, PIANO_KEYDOWN_COLOR_BOT);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = PIANO_KEYDOWN_COLOR_BOT;
    
    // Inset shadow effect (dark shadow at top, lighter at bottom)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = SHADOW_BLUR * 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3; // Inward shadow
  } else if (glowEffect && glowEffect.intensity > 0) {
    // Apply glow effect from bubble hit
    ctx.fillStyle = r.fillStyle;
    ctx.strokeStyle = glowEffect.color;
    ctx.shadowColor = glowEffect.color;
    ctx.shadowBlur = SHADOW_BLUR * 4 * glowEffect.intensity;
    ctx.lineWidth = r.lineWidth + 2 * glowEffect.intensity;
  } else {
    ctx.fillStyle = r.fillStyle;
    ctx.strokeStyle = r.strokeStyle;
  }

  ctx.lineWidth = r.lineWidth;

  if (r.isBlack && !isKeyDown) {
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = -5;
    ctx.shadowOffsetY = 5;
  } else if (!isKeyDown) {
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (r.isBlack) {
    drawRoundRect(ctx, adjustedRect.x, adjustedRect.y, adjustedRect.width, adjustedRect.height, 5, true, true);
    
    // Add inner shadow for pressed black keys
    if (isKeyDown) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const innerGradient = ctx.createLinearGradient(adjustedRect.x, adjustedRect.y, adjustedRect.x, adjustedRect.y + adjustedRect.height * 0.3);
      innerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      innerGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGradient;
      drawRoundRect(ctx, adjustedRect.x, adjustedRect.y, adjustedRect.width, adjustedRect.height * 0.3, 5, true, false);
      ctx.restore();
    }
  } else {
    ctx.fillRect(adjustedRect.x, adjustedRect.y, adjustedRect.width, adjustedRect.height);
    ctx.strokeRect(adjustedRect.x, adjustedRect.y, adjustedRect.width, adjustedRect.height);
    
    // Add inner shadow for pressed white keys
    if (isKeyDown) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const innerGradient = ctx.createLinearGradient(adjustedRect.x, adjustedRect.y, adjustedRect.x, adjustedRect.y + adjustedRect.height * 0.2);
      innerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      innerGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGradient;
      ctx.fillRect(adjustedRect.x, adjustedRect.y, adjustedRect.width, adjustedRect.height * 0.2);
      ctx.restore();
    }
  }

  removeShadow();

  // Skip rendering keyboard text on mobile devices
  if (!isMobile.value) {
    ctx.font = KB_FONT;
    const xOffset = ctx.measureText(r.text || '').width / 2;

    if (r.isBlack) {
      ctx.fillStyle = WHITE;
      const x = adjustedRect.x + adjustedRect.width / 2 - xOffset;
      let y = adjustedRect.y + adjustedRect.height * 0.32;
      ctx.fillText(r.text || '', x, y);
      y += KB_FONT_SIZE * 1.3;
      ctx.fillText('↑', x, y);
    } else {
      ctx.fillStyle = isKeyDown ? WHITE : BLACK;
      const x = adjustedRect.x + adjustedRect.width / 2 - xOffset;
      const y = adjustedRect.y + adjustedRect.height * 0.28;
      ctx.fillText(r.text || '', x, y);
    }
  }
};

const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
  removeShadow();
};

const removeShadow = () => {
  if (!ctx) return;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const drawBubbles = (bubbles: Bubble[]) => {
  if (!ctx) return;

  bubbles.forEach(b => {
    ctx!.save();

    // Create beautiful gradient for each bubble
    const gradient = ctx!.createLinearGradient(b.x, b.y, b.x, b.y + b.height);

    // Lighter shade at top, main color at bottom
    const mainColor = b.color;
    const lighterColor = lightenColor(mainColor, 30);
    const darkerColor = darkenColor(mainColor, 10);

    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.5, mainColor);
    gradient.addColorStop(1, darkerColor);

    ctx!.fillStyle = gradient;
    ctx!.shadowColor = mainColor;
    ctx!.shadowBlur = SHADOW_BLUR;

    drawRoundRect(ctx!, b.x, b.y, b.width, b.height, b.width / 2, true, false);

    ctx!.restore();
  });
};

// Helper function to lighten a hex color
const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

// Helper function to darken a hex color
const darkenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

const update = () => {
  if (!ctx || !canvasRef.value) return;

  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);

  engine.updateVolumes(true);

  // Draw background effects first (behind everything)
  drawBackgroundEffects();

  // Calculate bubbles based on current playback time
  const bubbles = calculateBubbles();
  drawBubbles(bubbles);

  // Update and draw particles
  if (isPlaying.value) {
    const currentTime = performance.now();

    if (lastFrameTime === 0) {
      lastFrameTime = currentTime;
    }

    // Calculate time delta and apply playback speed
    const deltaMs = (currentTime - lastFrameTime) * playbackSpeed.value;
    lastFrameTime = currentTime;

    // Update all particle effects
    updateSmokeParticles(deltaMs);
    updateSparkParticles(deltaMs);
    updateKeyGlowEffects(deltaMs);
    updateBackgroundWaves(deltaMs);
    updateFloatingParticles(deltaMs);
    updateMusicReactiveEffects(deltaMs);

    // Update playback time
    const previousTime = playbackTime.value;
    playbackTime.value += deltaMs;

    // Play notes that should trigger in this time range
    playNotesInTimeRange(previousTime, playbackTime.value);

    // Stop if we've reached the end
    if (playbackTime.value >= totalDuration.value) {
      pause();
      playbackTime.value = totalDuration.value;
    }
  } else {
    lastFrameTime = 0;
    // Still update particles even when paused
    updateSmokeParticles(16);
    updateSparkParticles(16);
    updateKeyGlowEffects(16);
    updateBackgroundWaves(16);
    updateFloatingParticles(16);
    updateMusicReactiveEffects(16);
  }

  // Draw all particles on top
  drawSmokeParticles();
  drawSparkParticles();

  // Cache current keys as a Set for faster lookup
  const currentKeysSet = new Set(engine.getCurrentKeys());

  keyboardRects.forEach(r => {
    if (!r.isBlack) drawKey(r, currentKeysSet);
  });

  keyboardRects.forEach(r => {
    if (r.isBlack) drawKey(r, currentKeysSet);
  });

  animationFrameId = requestAnimationFrame(update);
};

const onResize = () => {
  if (!canvasRef.value) return;

  canvasRef.value.width = window.innerWidth;
  canvasRef.value.height = window.innerHeight;

  canvasWidth.value = window.innerWidth;
  canvasHeight.value = window.innerHeight;

  engine.setDimensions(window.innerWidth, window.innerHeight);
  keyboardRects = engine.createKeyboardRects();

  pianoY.value = window.innerHeight * 0.73;

  // Cache key dimensions for performance
  cachedWhiteKeyWidth = keyboardRects[0]?.width || 0;
  cachedBlackKeyWidth = keyboardRects.find(r => r.isBlack)?.width || 0;
  cachedBubbleWidth = cachedWhiteKeyWidth - cachedBlackKeyWidth;
  if (shouldThinBubbles.value) {
    cachedBubbleWidth *= 0.5;
  }

  calcTotalDuration();

  // Reinitialize floating particles for new screen size
  initFloatingParticles();

  // Reinitialize and reposition wave canvas
  if (waveCanvasRef.value) {
    waveCanvasRef.value.width = window.innerWidth;
    waveCanvasRef.value.height = 60;
    // Position wave at keyboard top edge
    waveCanvasRef.value.style.top = `${window.innerHeight * 0.73 - 30}px`;
    
    // Restart wave animation to adapt to new dimensions
    if (waveAnimationId) {
      cancelAnimationFrame(waveAnimationId);
    }
    animateWaves();
  }

  // Bubbles will be recalculated automatically in the next frame
};

// Wave animation functions
let waveAnimationId: number;

const initWaveCanvas = () => {
  if (!waveCanvasRef.value) return;
  
  waveCanvasRef.value.width = window.innerWidth;
  waveCanvasRef.value.height = 60;
  // Position wave at keyboard top edge (keyboard is at 73% from top)
  waveCanvasRef.value.style.top = `${window.innerHeight * 0.73 - 30}px`;
};

const animateWaves = () => {
  if (!waveCanvasRef.value) return;

  const waveCtx = waveCanvasRef.value.getContext('2d');
  if (!waveCtx) return;

  const width = waveCanvasRef.value.width;
  const height = waveCanvasRef.value.height;
  const centerY = height / 2;

  let time = 0;

  const drawWave = () => {
    waveCtx.clearRect(0, 0, width, height);

    time += 0.02;

    // Define 3 wave layers: 1 thick stable base wave + 2 complex composite waves
    const waves = [
      { freq: 0.02, amp: 2, phase: time * 0.5, speed: 0.3, color: WAVE_COLOR, width: 8, glow: 30 }, // Thick stable base wave
      { freq: 0.025, amp: 3.5, phase: time * 1.2, speed: 1, color: WAVE_COLOR, width: 3, glow: 20 }, // Complex wave 1
      { freq: 0.035, amp: 2.5, phase: time * 0.8, speed: -0.7, color: WAVE_COLOR, width: 2.5, glow: 25 } // Complex wave 2
    ];

    // Draw each wave layer
    waves.forEach((wave, index) => {
      waveCtx.beginPath();
      waveCtx.strokeStyle = wave.color;
      waveCtx.lineWidth = wave.width;
      waveCtx.shadowColor = wave.color;
      waveCtx.shadowBlur = wave.glow;
      waveCtx.lineCap = 'round';
      waveCtx.lineJoin = 'round';

      for (let x = 0; x <= width; x += 2) {
        // Complex wave function: combine multiple sine waves with different frequencies
        let y = centerY;

        // Primary wave
        y += Math.sin(x * wave.freq + wave.phase + wave.speed * time) * wave.amp;

        // Add harmonics for complexity
        y += Math.sin(x * wave.freq * 2.3 + wave.phase * 1.7) * (wave.amp * 0.3);
        y += Math.sin(x * wave.freq * 3.7 + wave.phase * 0.6) * (wave.amp * 0.2);
        y += Math.sin(x * wave.freq * 5.1 - wave.phase * 1.3) * (wave.amp * 0.15);

        // Add dampening near edges for visual interest
        const edgeFactor = Math.min(x / 100, (width - x) / 100, 1);
        const dampening = Math.pow(edgeFactor, 0.5);
        y = centerY + (y - centerY) * dampening;

        if (x === 0) {
          waveCtx.moveTo(x, y);
        } else {
          waveCtx.lineTo(x, y);
        }
      }

      waveCtx.stroke();

      // Add extra glow layer for the brightest wave
      if (index === 2) {
        waveCtx.shadowBlur = wave.glow * 2;
        waveCtx.globalAlpha = 0.3;
        waveCtx.stroke();
        waveCtx.globalAlpha = 1;
      }
    });

    waveAnimationId = requestAnimationFrame(drawWave);
  };

  drawWave();
};

onMounted(async () => {
  if (!canvasRef.value) return;

  ctx = canvasRef.value.getContext('2d');
  engine = new PianoEngine();

  await engine.initSounds();

  // Load default MIDI sheets from public folder
  await loadDefaultSheets();
  reloadSheets();
  sheetKeys.value = getSheetNames();

  // Initialize volume
  updateVolume();

  onResize();
  loadSavedSelection();
  initSheet();
  initFloatingParticles();
  initWaveCanvas();
  animateWaves();

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('click', handleOutsideClick);

  update();
});

const handleOutsideClick = (e: MouseEvent) => {
  // Close volume slider when clicking outside
  const target = e.target as HTMLElement;
  if (showVolumeSlider.value && !target.closest('.relative.flex.items-center.gap-2')) {
    showVolumeSlider.value = false;
  }
};

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  if (waveAnimationId) {
    cancelAnimationFrame(waveAnimationId);
  }

  // Clear all active note timeouts
  activeNoteTimeouts.forEach(timeout => clearTimeout(timeout));
  activeNoteTimeouts.clear();

  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
/* Sheet Selector with Ellipsis */
.sheet-selector {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-selector option {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Volume Slider Styling */
.volume-slider {
  background: linear-gradient(to top,
      #10b981 0%,
      #10b981 var(--volume-fill, 70%),
      #374151 var(--volume-fill, 70%),
      #374151 100%);
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  transform: scale(1.2);
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.6);
}

.volume-slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  transform: scale(1.2);
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.6);
}

@keyframes pulse-subtle {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

/* Animated Electric Wave Border */
.wave-border-canvas {
  position: absolute;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 5555;
  pointer-events: none;
}
</style>
