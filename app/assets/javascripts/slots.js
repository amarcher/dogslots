// Constants
NumberOfImages = 13;
PurebredCount = NumberOfImages - 1;
StartBones = 3;
InitialSpinDuration = .5;
AdvanceDuration = 1;
MidSpinDuration = 12;
EndSpinDuration = 1;
TopOffset = 0;

function EASE_IN(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * (currentIteration /= totalIterations) * currentIteration + startValue;
}

function EASE_OUT(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * Math.sin(currentIteration / totalIterations * (Math.PI / 2)) + startValue;
}

function NO_EASING(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * currentIteration / totalIterations + startValue;
}


ion.sound({
  sounds: [
    {name: "dog bark"},
    {name: "register"},
    {name: "success"},
    {name: "coin"},
    {name: "game start"},
    {name: "tap"},
  	{name: "FAIL"}
  ],
  volume: 1,
  path: "sounds/",
  preload: true
});

function Bone(boneId) {
	this.el = null;
	this.boneId = boneId;
	this.context = {
    bone_id: this.boneId
  };
	this.html = bone_template(this.context);
	this.boneBank = $('.incoming'); // TODO: move after doc loads
}

Bone.prototype = {
	add: function() {
		this.boneBank.prepend(this.html);
		this.el = $('#bone_' + this.boneId);
		this.el.css({ top: '-200px' }).animate({ 
      top: "+=600px",
    },
    750);
	},

	remove: function() {
		this.el.animate({ 
      top: "+=800px",
    }, 500).hide(1000);
	}
};

function NameArea(node) {
	this.names = node.children();
	this.activeEl = null;
}

NameArea.prototype = {
  display: function(newPos) {
  	this.activeEl = $('[data-posone="' + newPos[0] + '"][data-postwo="' + newPos[1] + '"]');
  	this.activeEl.toggleClass('hide');
  },

  clearOut: function() {
  	if (this.activeEl) {
  		this.activeEl.toggleClass('hide');
  	}
  }
};

function Reel(el, top, callback) {
	this.el = el;
  this.img = el.find('.reel');
	this.top = top;
  this.offset = TopOffset * (1 - top);
	this.spinning = false;
	this.callback = callback;
  this.position = 0;
}

Reel.prototype = {
  reset: function() {
    this.iterations = 1;
    this.imgWidth = this.imgWidth || 13 * this.img.get(0).offsetWidth / 14.0;
    this.cellWidth = this.cellWidth || this.imgWidth / (1.0 * NumberOfImages);
    this.setPosition(this.getPosition());
  },

  stop: function(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    ion.sound.play("tap");
    this.el.off("mousedown");
    this.spinning = false;
  },

  advanceTo: function(index, callback) {
    this.reset();
    this.spinning = true;

    var endValue = this.cellWidth * (index - 1);

    requestAnimationFrame(this._spin.bind(this, {
      startValue: this.position,
      endValue: -endValue,
      totalIterations: AdvanceDuration * 60,
      easingFunction: NO_EASING,
      callback: callback
    }));
  },

	getPosition: function() {
		return this.position % this.imgWidth;
	},

  setPosition: function(left) {
    this.position = left;
    this.img.get(0).style.left = this.getPosition() + 'px';
  },

  initialSpin: function() {
    this.reset();
    this.spinning = true;

    var endValue = this.cellWidth * (1 + 2 * Math.random());

    requestAnimationFrame(this._spin.bind(this, {
      startValue: this.position,
      endValue: -endValue,
      totalIterations: InitialSpinDuration * 60 + this.offset,
      easingFunction: EASE_IN,
      callback: this.midSpin.bind(this)
    }));
  },

  midSpin: function() {
    this.spinning = true;

    var endValue = 3 * this.imgWidth + Math.ceil(Math.random() * NumberOfImages) * this.cellWidth;
    this.el.on("mousedown", this.stop.bind(this));

    requestAnimationFrame(this._spin.bind(this, {
      startValue: this.position,
      endValue: -endValue,
      totalIterations: MidSpinDuration * 60,
      easingFunction: NO_EASING,
      callback: this.endSpin.bind(this)
    }));
  },

  endSpin: function() {
    this.stop();
    this.spinning = true;

    var clickedCell = -Math.round(this.position / this.cellWidth);
    var endValue = (clickedCell + 2) * this.cellWidth;
    var endIndex = (clickedCell + 2) % NumberOfImages;

    requestAnimationFrame(this._spin.bind(this, {
      startValue: this.position,
      endValue: -endValue,
      totalIterations: EndSpinDuration * 60,
      easingFunction: EASE_OUT,
      callback: function() {
        this.callback(endIndex + 1, this.top);
      }.bind(this)
    }));
  },

  _spin: function(opts) {
    var newPosition = opts.easingFunction(this.iterations, opts.startValue, (opts.endValue - opts.startValue), opts.totalIterations);

    if (this.spinning && newPosition > opts.endValue) {
      this.iterations++;
      this.setPosition(newPosition);
      requestAnimationFrame(this._spin.bind(this, opts));
    } else {
      this.iterations = 1;
      this.spinning = false;
      opts.callback();
    }
  }
};

function Slot(els, boneEl, controlEl, nameEl) {
	this.reels = [ new Reel($(els[0]), true, this.callback.bind(this)), new Reel($(els[1]), false, this.callback.bind(this)) ];
	this.positions = [1, 1];
	this.bones = [];
	this.nextBoneId = 0;
	this.boneTally = 0;
	this.boneTallyArea = boneEl;
	this.control = controlEl;
	this.nameArea = new NameArea(nameEl);
	this.activeVideo = null;
	this.trophies = [];
	this.spinningReels = 0;
	this.bowl = $('.bowl');
	this.setUpGame();
}

Slot.prototype = {

	setUpGame: function() {
		this.addBones(StartBones);
		this.enableControls();
		this.clearDogName();

		// event handlers for end-game
		$(document).on('click', '#start_over', function(event) {
	  	event.stopPropagation();
	  	console.log('starting over');
	  	this.restart();
	  	this.playSound('game start');
	  	$('#overlay, .modal').remove();
	  }.bind(this));
	  $(document).on('click', '#get_more_bones', function(event) { 
	  	event.stopPropagation();
	  	console.log('getting more bones');
	  	this.addBones(StartBones);
	  	this.enableControls();
	  	this.playSound('register');
	  	$('#overlay, .modal').remove();
	  }.bind(this));
	},

	start: function() {
		this.stopVideo();
		this.playSound('coin');
		this.removeBone();
		this.disableControls();
		this.clearDogName();
		this.spinningReels = 1;
		this.reels[1].initialSpin();
	},

	callback: function(finalPos, top) {
		var index = top ? 0 : 1;
		this.positions[index] = finalPos;
		this.spinningReels--;

		if (this.spinningReels === 0) {
			this.setDogName();

			if (this.winner()) {
				this.win();
			} else if (!this.winner() && this.boneTally === 0) {
				setTimeout(this.gameOver.bind(this), 600);
			} else {
				this.enableControls();
			}

			if (this.trophies.length === PurebredCount) {
				setTimeout(this.endGameWithWin.bind(this), 4500);
			}
		}
 	},

 	winner: function() {
 		if (this.positions[0] === 13 || this.positions[1] === 13) {
 			return true;
 		} else {
 			return this.trueMatch();
 		}
 	},

 	win: function() {
 		if (this.trueMatch()) {
	 		var match = this.positions[1];
	 		if (this.trophies.indexOf(match) === -1) {
	 			this.trophies.push(match);
	 			$('.trophy[data-id="'+match+'"]').css({
			     '-webkit-transform' : 'rotateY(-1440deg)',
			     '-moz-transform' : 'rotateY(-1440deg)',  
			      '-ms-transform' : 'rotateY(-1440deg)',  
			       '-o-transform' : 'rotateY(-1440deg)',  
			          'transform' : 'rotateY(-1440deg)'
	 			}).addClass('earned');

        this.positions[0]++;
        setTimeout(this.reels[0].advanceTo.bind(this.reels[0], this.positions[0], function() {
          this.enableControls();
          this.clearDogName();
          this.setDogName();
        }.bind(this)), 4500);
	 		}
    } else {
      this.enableControls();
    }
    
 		this.addBones(this.payout());
	 	this.playSound('success');
 	},

 	playSound: function(name) {
  	ion.sound.play(name);
  },

 	playVideo: function(index) {
 		var videoIndex, activeVideo;
 		if (index > 0 && index < 13) {
 			videoIndex = index;
 		} else {
			videoIndex = 1;
		}
		
		activeVideo = this.activeVideo = $('video[data-id="' + videoIndex + '"]').show();
 		activeVideo.get(0).play();
 		activeVideo.get(0).addEventListener('ended', function() { 
 			activeVideo.hide();
 			activeVideo.load();
 		});
 	},

 	stopVideo: function() {
 		if (this.activeVideo && (! this.activeVideo.get(0).paused)){
 			this.activeVideo.get(0).pause();
 			this.activeVideo.hide();
 			this.activeVideo.load();
 		}
 	},

 	trueMatch: function() {
 		return this.positions[0] === this.positions[1] && this.positions[0] !== NumberOfImages;
 	},

  payout: function() {
  	// double wolf is a mega win 
  	if (this.positions[0] === NumberOfImages && this.positions[1] === NumberOfImages) {
  		return 25;
  	} else {
	  	return 3;
	  }
  },

  setDogName: function() {
  	this.nameArea.display(this.positions);
  },

  clearDogName: function() {
  	this.nameArea.clearOut();
  },

  restart: function() {
  	// remove all bones
  	console.log('restarting');

  	for (var i=0; i<this.bones.length; i++) {
  		this.removeBone();
  	}

    this.positions = [1, 1];
    this.addBones(StartBones);
    this.trophies = [];
    $('.trophy').removeClass('earned').css({
           '-webkit-transform' : 'rotateY(0deg)',
           '-moz-transform' : 'rotateY(0deg)',  
            '-ms-transform' : 'rotateY(0deg)',  
             '-o-transform' : 'rotateY(0deg)',  
                'transform' : 'rotateY(0deg)'
        });
    this.reels[0].advanceTo(this.positions[0], this.enableControls.bind(this));
  },

  gameOver: function() {
  	var trophies = [];
  	this.playSound("FAIL");
    for (var i=0; i<PurebredCount; i++) {
      if (this.trophies.indexOf(i+1) > -1) {
  			trophies[i] = 'earned';
  		} else {
  			trophies[i] = '';
  		}
  	}
	  var html = modal_template({
      trophies: trophies,
      toys: this.trophies.length,
      plural: this.trophies.length === 1 ? "Y" : "IES"
    });

	  $(html).css("opacity", "0").appendTo('body');
	  $('#overlay').animate(
	  	{
        opacity: ".8"
      },
	  	1000
	 );
	  $('.modal').animate(
	  	{
        opacity: "1"
      },
	  	1000
	 );
  },

  disableControls: function() {
    this.control.prop("disabled", true);
  	this.control.text('Stop');
    
    setTimeout(function() {
      this.control.prop("disabled", false);
      this.control.off('click');
      this.control.on('click', function() {
        this.control.off('click');
        this.control.prop('disabled', true);
        this.reels[1].stop();
      }.bind(this));
    }.bind(this), (InitialSpinDuration + TopOffset / 60) * 1000);
  },

  enableControls: function() {
    this.control.prop('disabled', false);
    this.control.text('Spin');
    this.control.off('click');
    this.control.on('click', this.start.bind(this));
  },

  addBone: function(delay) {
  	var that = this;
  	var bone = new Bone(this.nextBoneId);

  	var updateBoneTally = function() {
  		that.boneTallyArea.text(that.boneTally);
  		that.setBowlImage();
  	};

  	var addOne = function(delay) {
			that.bones.unshift(bone);
	 		that.boneTally++;
	  	that.nextBoneId++;
	  	bone.add();
  	};

  	setTimeout(addOne, 200*delay);
  	setTimeout(updateBoneTally, 750 + 200*delay);
	},

  addBones: function(bones) {
  	for (var j=0; j<bones; j++) {
  		this.addBone(j);
  	}
  },

  setBowlImage: function() {
  	var bones = this.boneTally;
  	switch(true) {
  		case (bones > 10):
  			this.bowl.addClass('full');
  			this.bowl.removeClass('half-full');
  			this.bowl.removeClass('empty');
  			break;
  		case (bones < 1):
  			this.bowl.removeClass('full');
  			this.bowl.removeClass('half-full');
  			this.bowl.addClass('empty');
  			break;
  		default:
	  		this.bowl.removeClass('full');
	  		this.bowl.addClass('half-full');
	  		this.bowl.removeClass('empty');
	  		break;
  	}
  },

  removeBone: function() {
  	var bone = this.bones.pop();
  	bone.remove();
  	this.boneTally--;
  	this.boneTallyArea.text(this.boneTally);
  	this.setBowlImage();
  },

  endGameWithWin: function() {
  	var html = winning_template({toys: this.trophies.length, plural: this.trophies.length === 1 ? "" : "s" });
  	$(html).css("opacity", "0").appendTo('body');
  	$('#overlay').animate(
  		{opacity: ".8"},
  		1000
  	);
  	$('.modal').animate(
  		{opacity: "1"},
  		1000
  	);
  }
};

$(document).ready(function() {
	// precompile templates

	var bone_source   = $("#bone-template").html();
	var modal_source   = $("#modal-template").html();
	var winning_source   = $("#winning-template").html();

	// global variable
	bone_template = Handlebars.compile(bone_source);
	modal_template = Handlebars.compile(modal_source);
	winning_template = Handlebars.compile(winning_source);

	var slot = new Slot($('.slot'), $('.bones'), $('#control'), $('.dogname'));
});