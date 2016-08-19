$(document).ready(function () {
      var TypeSwitch = require('type-switch');
      var functions = require('./functions.js');
      var $gameContainer = $('#gameContainer');
      var $message = $('#message');
      var $prompt = $('#prompt');
      var $underScore = $('#underScore');
      var $timer = $('#timer');
      var $points = $('#points');
      var $playButton = $('#playButton');
      var incorrectTone = new functions.sound('resources/zap2.mp3');
      var Game = new TypeSwitch({stubbornMode: true});
      var elapsedTime = setInterval(function () {
        functions.divideTime(Game.getGameStats().time, $timer);
      }, 1000);
      var prompt = 'Type-switch is a portable signal engine used to power games and interactive experiences with keypress events!';

      function Particle(sprite, scene) {
        this.init = function () {
          sprite.position.set(0, 0, 0);
          sprite.scale.x = sprite.scale.y = Math.random() * 32 + 60;
          new TWEEN.Tween(sprite.position)
          .to({
            x: Math.random() * 4000 - 2000,
            y: Math.random() * 2000 - 1000,
            z: Math.random() * 6000 - 3000
            }, 2750)
            .start();
          new TWEEN.Tween(sprite.scale)
            .to({
              x: 0.1,
              y: 0.1
            }, 2750)
            .start();
          scene.add(sprite);
        };
      }

      function Burst(colorChoice, scene) {
        function generateSprite() {
          var canvas = document.createElement('canvas');
          var colors = ['rgba(255, 71, 71,', 'rgba(0, 206, 237,', 'rgba(255, 255, 255,', 'rgba(255, 71, 71,', 'rgba(0, 206, 237,', 'rgba(255, 255, 255,'];
          var color = colors[colorChoice];
          canvas.width = 64;
          canvas.height = 64;
          var context = canvas.getContext('2d');
          var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
          gradient.addColorStop(0, color + ' 1)');
          gradient.addColorStop(0.4, color + ' .6');
          gradient.addColorStop(0.7, color + ' .3');
          gradient.addColorStop(1, 'rgba(0,0,0,1');
          context.fillStyle = gradient;
          context.fillRect(0, 0, canvas.width, canvas.height);
          return canvas;
        }
        var material = new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(generateSprite()),
          blending: THREE.AdditiveBlending
        });
        this.members = [];
        for (var i = 0; i < 30; i++) {
          this.members.push(new Particle(new THREE.Sprite(material), scene));
        }

        this.emit = function () {
          this.members.forEach(function (m) {
            m.init();
          });
        };
      }

      function ThreeScene() {
        this.container = document.getElementById('particles');
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this.camera.position.z = 1000;
        this.renderer.setClearColor(0x000000);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.render = function () {
          TWEEN.update();
          this.renderer.render(this.scene, this.camera);
        };
      }

      ThreeScene.prototype.onWindowResize = function () {
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.updateProjectionMatrix();
      }

      ThreeScene.prototype.animate = function () {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
      };

      var onCorrectParticleEffect = new ThreeScene();
      var onCorrectParticleBursts = [];
      var currentBurst = 0;
      for (var i = 0; i < 6; i++) {
        onCorrectParticleBursts.push(new Burst(i, onCorrectParticleEffect.scene));
      }
      function burstAlternate() {
        onCorrectParticleBursts[currentBurst].emit();
        currentBurst++;
        currentBurst = currentBurst > 5 ? 0 : currentBurst;
      }

      function verticalSlide(el, val) {
        $(el).animate({
          bottom: val
        }, 1500);
      }

      function shake(el) {
        var $el = $(el);
        $el.animate({
          marginLeft: 50
        }, 150, function () {
          $el.animate({
            marginLeft: 0
          }, 550, 'easeOutBounce');
        });
      }

      function setLetterColor() {
        var letters = document.querySelectorAll('.letter');
        for (var i = 0, length = letters.length; i < length; i++) {
          var currentLetter = letters[i];
          if (i < Game.getGameStats().currentIndex) {
            currentLetter.setAttribute('class', 'letter done');
          }
          else if (i === Game.getGameStats().currentIndex) {
            currentLetter.setAttribute('class', 'letter active');
          } else {
            currentLetter.setAttribute('class', 'letter queued');
          }
        }
      }

      function shiftPrompt() {
        var totalOffset = 0;
        var $done = $('.done');
        var $active = $('.active');
        $done.each(function () {
          totalOffset += $(this).width();
        });
        totalOffset += $active.width() / 2;
        $prompt.css('transform', 'translateX(-' + totalOffset + 'px) translateY(-50%)');
      }

      $('#playButton').on('click', function () {
          onCorrectParticleEffect.animate();
          $points.text('0');
          Game.start(prompt);
          $prompt.html('');
          functions.appendGamePrompt(prompt);
          setLetterColor();
          $prompt.fadeIn(2000);
          $message.css('animation', 'none').fadeOut(1000);
          shiftPrompt();
          verticalSlide($underScore, '20px');
          $(this).css('opacity', .2);
      });

      Game.on('correct', function () {
        var gameStats = Game.getGameStats();
        setLetterColor();
        shiftPrompt();
        functions.calcPoints('correct', $points);
        burstAlternate();
      });

      Game.on('incorrect', function () {
        functions.playSound(incorrectTone);
        functions.calcPoints('incorrect', $points);
        shake($('.active'));
      });

      Game.on('complete', function () {
        $message.html('').append('<p>GAME OVER</br>Points:</br>' + $points.text()+ '</br>Duration:</br>' + $timer.text() + '</br>Press the play button to try again</p>');
        $message.fadeIn(1500).css('animation', 'Pulse 1.5s linear infinite alternate');
        $prompt.fadeOut(1500).html('');
        verticalSlide($underScore, '-130px');
        Game.resetGame();
        $('#playButton').css('opacity', 1);
      });
    });
