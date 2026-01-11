<template>
    <div class="stars-container">
        <div class="stars-box">
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
        </div>
        <div class="fog"></div>
        <div class="horizon"></div>
    </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
@import '../../styles/genshin/stars.scss';

$FOG_W: 150rem;
$FOG_H: 90rem;

@keyframes fog-move {

    0% {
        background-position-x: $FOG_W;
        background-position-y: $FOG_H;
    }

    100% {
        background-position-x: 0;
        background-position-y: 0;
    }
}

@keyframes stars-bg-change {
    0% {
        filter: hue-rotate(0deg) brightness(0.8);
        -webkit-filter: hue-rotate(0deg) brightness(0.8);
    }

    50% {
        filter: hue-rotate(180deg) brightness(0.8);
        -webkit-filter: hue-rotate(180deg) brightness(0.8);
    }

    50% {
        filter: hue-rotate(360deg) brightness(0.8);
        -webkit-filter: hue-rotate(360deg) brightness(0.8);
    }
}

.stars-container {
    background-image: linear-gradient(180deg, #703519, #7d5326);
    animation: stars-bg-change 12s linear infinite;
    z-index: -998;

    div {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .fog {
        background-image: url(/img/fog.png);
        background-size: $FOG_W $FOG_H;
        animation: fog-move 50s linear infinite;
        opacity: 0.8;
        top: 0;
        left: 0;
    }

    .horizon {
        background-image: linear-gradient(0,
                rgba(0, 0, 0, 0),
                rgba(255, 255, 255, 0.6),
                rgba(0, 0, 0, 0));
        opacity: 0.3;
        height: 30% !important;
        left: 0;
        bottom: 5rem;
    }
}
</style>