<template>
  <!-- Star Background Layer -->
  <div class="stars-container select-none">
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
</template>

<script setup lang="ts">
// No props or logic needed - this is a pure visual component
</script>

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
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
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
  box-shadow:
    3201px 511px #fff,
    2811px 119px #fff,
    1086px 956px #fff,
    2963px 1829px #fff,
    3412px 1242px #fff,
    490px 469px #fff,
    2869px 425px #fff,
    1447px 891px #fff,
    3722px 1860px #fff,
    517px 1895px #fff,
    2338px 171px #fff,
    1328px 1668px #fff,
    2874px 1490px #fff,
    1083px 81px #fff,
    3632px 98px #fff,
    1518px 1764px #fff,
    3336px 596px #fff,
    2178px 131px #fff,
    2978px 1179px #fff,
    1898px 1851px #fff,
    3587px 326px #fff,
    2186px 1588px #fff,
    552px 1842px #fff,
    1929px 1300px #fff,
    3202px 681px #fff,
    2430px 1711px #fff,
    1192px 308px #fff,
    3123px 1604px #fff,
    2880px 169px #fff,
    1400px 632px #fff,
    3100px 1165px #fff,
    288px 1208px #fff,
    2319px 1418px #fff,
    1170px 980px #fff,
    3408px 784px #fff,
    1735px 1276px #fff,
    2966px 1534px #fff,
    3654px 783px #fff,
    1366px 964px #fff,
    3213px 60px #fff,
    302px 1509px #fff,
    2845px 714px #fff,
    3524px 323px #fff,
    1538px 1399px #fff,
    3394px 619px #fff,
    680px 26px #fff,
    2353px 776px #fff,
    1826px 1450px #fff,
    3109px 1452px #fff,
    1014px 1315px #fff,
    2683px 1474px #fff,
    3766px 1742px #fff,
    1693px 658px #fff,
    3186px 302px #fff,
    2376px 1575px #fff,
    712px 1739px #fff,
    2827px 299px #fff,
    3482px 224px #fff,
    1379px 510px #fff,
    2543px 1602px #fff,
    3045px 606px #fff,
    827px 1336px #fff,
    3224px 1839px #fff,
    1098px 1342px #fff,
    2813px 1553px #fff,
    3625px 419px #fff,
    519px 894px #fff,
    2406px 797px #fff,
    3341px 274px #fff,
    1787px 903px #fff,
    2901px 1483px #fff,
    3108px 232px #fff,
    1599px 1409px #fff,
    2659px 870px #fff,
    3538px 335px #fff,
    632px 1855px #fff,
    3154px 1026px #fff,
    1722px 979px #fff,
    2339px 509px #fff,
    3634px 460px #fff,
    2315px 65px #fff,
    496px 1927px #fff,
    3314px 427px #fff,
    2344px 1046px #fff,
    1658px 724px #fff,
    2699px 264px #fff,
    1200px 1305px #fff,
    3562px 342px #fff,
    2159px 766px #fff,
    1639px 1862px #fff,
    3461px 1898px #fff,
    944px 763px #fff,
    3174px 1056px #fff,
    2625px 790px #fff,
    906px 1524px #fff,
    3537px 1300px #fff,
    2079px 1106px #fff,
    1316px 672px #fff,
    3232px 61px #fff,
    2709px 1076px #fff,
    1010px 1814px #fff,
    3773px 1160px #fff,
    1598px 1427px #fff,
    2815px 1172px #fff,
    1005px 1158px #fff,
    3676px 1003px #fff,
    1025px 1529px #fff,
    2066px 549px #fff,
    3516px 457px #fff,
    262px 1005px #fff,
    2812px 1706px #fff,
    1164px 1087px #fff,
    3165px 45px #fff,
    2677px 1462px #fff,
    580px 1655px #fff,
    3648px 1384px #fff,
    2449px 1882px #fff,
    1830px 1455px #fff,
    2969px 488px #fff,
    1188px 313px #fff,
    3599px 1725px #fff,
    2792px 311px #fff,
    1927px 1933px #fff,
    3422px 742px #fff,
    98px 1635px #fff,
    2888px 752px #fff,
    3467px 118px #fff,
    1896px 231px #fff,
    3151px 320px #fff,
    2307px 169px #fff,
    3229px 229px #fff,
    1357px 20px #fff,
    2725px 1305px #fff,
    3023px 1877px #fff,
    426px 1945px #fff,
    2628px 1530px #fff,
    3256px 1295px #fff,
    2058px 78px #fff,
    409px 1145px #fff,
    3607px 767px #fff,
    2212px 144px #fff,
    361px 1890px #fff,
    2827px 1451px #fff,
    3675px 645px #fff,
    571px 853px #fff,
    2302px 301px #fff,
    3009px 1344px #fff,
    418px 619px #fff,
    3741px 90px #fff,
    949px 640px #fff,
    2179px 1783px #fff,
    3104px 360px #fff,
    1725px 370px #fff,
    2122px 1418px #fff,
    3374px 508px #fff,
    1105px 1089px #fff,
    2440px 1742px #fff,
    3461px 1493px #fff,
    1187px 265px #fff,
    2567px 74px #fff,
    3557px 542px #fff,
    967px 673px #fff,
    2825px 1970px #fff,
    3588px 1260px #fff,
    709px 1206px #fff,
    2528px 1586px #fff,
    3137px 854px #fff,
    1922px 1312px #fff,
    2481px 470px #fff,
    3224px 316px #fff,
    1979px 239px #fff,
    3022px 1155px #fff,
    1640px 186px #fff,
    2592px 1709px #fff,
    3765px 170px #fff,
    129px 1750px #fff,
    2789px 715px #fff,
    3449px 806px #fff,
    1398px 730px #fff,
    2287px 1027px #fff,
    3233px 297px #fff,
    1598px 1587px #fff,
    2918px 513px #fff,
    3516px 336px #fff,
    1572px 1007px #fff,
    2534px 231px #fff,
    3545px 972px #fff,
    1970px 1413px #fff,
    2285px 1079px #fff,
    3748px 582px #fff,
    2405px 186px #fff,
    1739px 1386px #fff,
    3253px 372px #fff,
    520px 620px #fff,
    2842px 852px #fff,
    3490px 386px #fff,
    1250px 143px #fff,
    2813px 537px #fff,
    3405px 614px #fff,
    1236px 1186px #fff,
    2287px 896px #fff,
    3626px 990px #fff,
    2031px 1067px #fff,
    1288px 939px #fff,
    2763px 338px #fff,
    3713px 1515px #fff,
    859px 1621px #fff,
    2720px 1984px #fff,
    3796px 1743px #fff,
    1438px 1587px #fff,
    2965px 412px #fff,
    775px 1168px #fff,
    3192px 956px #fff,
    2368px 1075px #fff,
    1485px 1154px #fff,
    2875px 1772px #fff,
    3515px 206px #fff,
    1596px 1256px #fff,
    2934px 1035px #fff,
    3603px 1004px #fff,
    1260px 433px #fff,
    2926px 1988px #fff,
    3667px 135px #fff,
    2240px 53px #fff,
    1919px 1832px #fff,
    2696px 1384px #fff,
    3630px 361px #fff,
    878px 663px #fff,
    2226px 1723px #fff,
    3765px 686px #fff,
    576px 1647px #fff,
    2097px 1602px #fff,
    3117px 1049px #fff,
    1433px 68px #fff,
    2375px 1991px #fff,
    3755px 990px #fff,
    1483px 801px #fff,
    2473px 1802px #fff,
    3822px 768px #fff,
    196px 577px #fff,
    2516px 504px #fff,
    3623px 981px #fff,
    1478px 819px #fff,
    2126px 384px #fff,
    3584px 1908px #fff,
    1549px 521px #fff,
    2866px 1335px #fff,
    3586px 342px #fff,
    1698px 642px #fff,
    2136px 188px #fff,
    3613px 520px #fff,
    937px 326px #fff,
    2111px 169px #fff;
  animation: animStar 50s linear infinite;
}

/* Stars Layer 2 - Medium stars */
.stars-2 {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow:
    922px 1554px #fff,
    1944px 550px #fff,
    1696px 1632px #fff,
    16px 1899px #fff,
    1894px 130px #fff,
    77px 262px #fff,
    22px 1159px #fff,
    933px 1206px #fff,
    1660px 482px #fff,
    1067px 1154px #fff,
    468px 625px #fff,
    1408px 1687px #fff,
    153px 1200px #fff,
    887px 1966px #fff,
    1260px 514px #fff,
    1167px 1158px #fff,
    790px 553px #fff,
    1103px 758px #fff,
    226px 1028px #fff,
    1340px 1760px #fff,
    1712px 528px #fff,
    114px 1693px #fff,
    185px 572px #fff,
    1566px 1793px #fff,
    317px 1501px #fff,
    846px 530px #fff,
    1585px 1437px #fff,
    1335px 1009px #fff,
    1768px 436px #fff,
    1131px 666px #fff,
    27px 1543px #fff,
    1778px 1861px #fff,
    1496px 30px #fff,
    1359px 1226px #fff,
    416px 135px #fff,
    1675px 673px #fff,
    296px 524px #fff,
    432px 1822px #fff,
    1995px 416px #fff,
    1206px 1846px #fff,
    542px 603px #fff,
    1811px 1083px #fff,
    1125px 1900px #fff,
    4px 1410px #fff,
    665px 1674px #fff,
    982px 365px #fff,
    809px 534px #fff,
    116px 1381px #fff,
    727px 439px #fff,
    1674px 1407px #fff,
    976px 1762px #fff,
    1585px 28px #fff,
    1916px 624px #fff,
    1716px 1118px #fff,
    1022px 177px #fff,
    807px 619px #fff,
    1657px 338px #fff,
    1608px 1259px #fff,
    405px 1890px #fff,
    433px 1978px #fff,
    1457px 1495px #fff,
    175px 990px #fff,
    850px 1044px #fff,
    170px 444px #fff,
    1623px 71px #fff,
    977px 1319px #fff,
    440px 464px #fff,
    51px 1209px #fff,
    782px 1274px #fff,
    1296px 244px #fff,
    1260px 94px #fff,
    652px 905px #fff,
    805px 1307px #fff,
    947px 822px #fff,
    384px 268px #fff,
    1856px 1782px #fff,
    459px 1844px #fff,
    1679px 473px #fff,
    673px 1832px #fff,
    96px 346px #fff,
    1268px 428px #fff,
    788px 1138px #fff,
    1242px 867px #fff,
    652px 831px #fff,
    994px 1706px #fff,
    1337px 64px #fff,
    1092px 624px #fff,
    674px 1344px #fff,
    1036px 405px #fff,
    996px 1371px #fff,
    1906px 1410px #fff,
    1285px 1079px #fff,
    1756px 582px #fff,
    404px 380px #fff,
    1738px 1619px #fff,
    1253px 372px #fff,
    520px 620px #fff,
    1842px 852px #fff,
    490px 386px #fff,
    1250px 143px #fff,
    1813px 537px #fff,
    1405px 614px #fff,
    1236px 1186px #fff,
    1287px 896px #fff,
    1626px 990px #fff,
    31px 1067px #fff,
    1288px 939px #fff,
    763px 338px #fff,
    713px 1515px #fff,
    859px 1621px #fff,
    1720px 1984px #fff,
    796px 1743px #fff,
    1438px 1587px #fff,
    965px 412px #fff,
    775px 1168px #fff,
    1192px 956px #fff,
    368px 1075px #fff,
    1485px 1154px #fff,
    1664px 1733px #fff,
    1939px 429px #fff,
    1664px 92px #fff,
    1806px 919px #fff,
    1712px 494px #fff,
    577px 1922px #fff,
    820px 1228px #fff,
    678px 1745px #fff,
    1421px 586px #fff,
    788px 208px #fff,
    380px 250px #fff,
    748px 977px #fff,
    1637px 337px #fff,
    851px 1514px #fff,
    1487px 1410px #fff,
    1776px 710px #fff,
    544px 453px #fff,
    1707px 1934px #fff,
    1121px 1642px #fff,
    1227px 391px #fff,
    583px 833px #fff,
    658px 278px #fff,
    346px 1388px #fff,
    1529px 1419px #fff,
    233px 1008px #fff,
    892px 943px #fff,
    1431px 1091px #fff,
    1524px 316px #fff,
    1549px 192px #fff,
    976px 36px #fff,
    1648px 1053px #fff,
    1834px 1572px #fff,
    1677px 936px #fff,
    589px 1755px #fff,
    978px 1875px #fff,
    1508px 412px #fff,
    1242px 439px #fff,
    1263px 40px #fff,
    1427px 1736px #fff,
    639px 906px #fff,
    1349px 373px #fff,
    1055px 969px #fff,
    602px 95px #fff,
    224px 1805px #fff,
    1129px 837px #fff,
    1110px 1358px #fff,
    1067px 1752px #fff,
    391px 1389px #fff,
    885px 1979px #fff,
    1188px 414px #fff,
    1931px 325px #fff,
    1853px 1918px #fff,
    636px 1313px #fff,
    1236px 1913px #fff,
    1801px 780px #fff,
    633px 529px #fff,
    1500px 33px #fff,
    1387px 1045px #fff,
    832px 1281px #fff,
    1880px 1845px #fff,
    1477px 1096px #fff,
    1457px 698px #fff,
    1658px 1049px #fff,
    1957px 1151px #fff,
    1561px 1593px #fff,
    627px 250px #fff,
    975px 1575px #fff,
    68px 998px #fff,
    951px 85px #fff,
    280px 431px #fff,
    1683px 1745px #fff,
    322px 778px #fff,
    842px 888px #fff,
    1895px 1883px #fff,
    700px 568px #fff,
    1846px 442px #fff,
    91px 1650px #fff,
    970px 917px #fff,
    1585px 452px #fff;
  animation: animStar 100s linear infinite;
}

/* Stars Layer 3 - Large stars */
.stars-3 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow:
    1679px 1408px #fff,
    1970px 1504px #fff,
    1789px 965px #fff,
    698px 234px #fff,
    1733px 1854px #fff,
    1060px 271px #fff,
    719px 1744px #fff,
    1707px 1847px #fff,
    1710px 432px #fff,
    1325px 1585px #fff,
    92px 577px #fff,
    163px 1939px #fff,
    1885px 123px #fff,
    1566px 1753px #fff,
    1288px 21px #fff,
    1396px 1908px #fff,
    675px 1466px #fff,
    734px 1557px #fff,
    941px 1885px #fff,
    1692px 6px #fff,
    115px 1183px #fff,
    639px 1044px #fff,
    1171px 1982px #fff,
    1801px 1078px #fff,
    648px 820px #fff,
    1885px 1984px #fff,
    268px 1729px #fff,
    1388px 181px #fff,
    1741px 1280px #fff,
    1719px 1080px #fff,
    12px 932px #fff,
    489px 157px #fff,
    1910px 790px #fff,
    115px 44px #fff,
    1748px 1458px #fff,
    282px 109px #fff,
    1100px 1528px #fff,
    543px 598px #fff,
    1320px 1188px #fff,
    1124px 839px #fff,
    1406px 1289px #fff,
    472px 1376px #fff,
    852px 286px #fff,
    510px 860px #fff,
    700px 306px #fff,
    1822px 1302px #fff,
    15px 19px #fff,
    1360px 420px #fff,
    1483px 42px #fff,
    1287px 1867px #fff,
    1105px 1322px #fff,
    745px 161px #fff,
    431px 1722px #fff,
    855px 1254px #fff,
    860px 1784px #fff,
    1578px 1955px #fff,
    1085px 461px #fff,
    472px 690px #fff,
    23px 1152px #fff,
    1625px 601px #fff,
    1177px 1692px #fff,
    397px 1984px #fff,
    10px 1164px #fff,
    1132px 1557px #fff,
    438px 817px #fff,
    1590px 1236px #fff,
    1037px 1616px #fff,
    533px 942px #fff,
    1163px 1992px #fff,
    1451px 1081px #fff,
    1335px 1572px #fff,
    503px 1556px #fff,
    197px 1725px #fff,
    511px 1397px #fff,
    1514px 1164px #fff,
    1249px 148px #fff,
    947px 1849px #fff,
    1258px 1426px #fff,
    255px 1937px #fff,
    23px 529px #fff,
    578px 230px #fff,
    925px 767px #fff,
    903px 365px #fff,
    1861px 450px #fff,
    1813px 912px #fff,
    1597px 637px #fff,
    195px 626px #fff,
    130px 404px #fff,
    725px 408px #fff,
    1916px 843px #fff,
    1336px 239px #fff,
    1568px 1390px #fff,
    139px 126px #fff,
    1287px 1271px #fff,
    731px 465px #fff,
    1959px 1465px #fff,
    909px 169px #fff,
    838px 1332px #fff,
    464px 1037px #fff,
    1893px 233px #fff;
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
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
}

/* Horizon Glow */
.horizon-glow {
  position: absolute;
  width: 100%;
  height: 30%;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(138, 43, 226, 0.3), rgba(0, 0, 0, 0));
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
</style>
