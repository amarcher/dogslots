// Constants
DebugModes = ["Off","First","AdvanceToWin","WinWithWild", "One from win"];
var debugIndex = 0;
NumberOfImages = 13;
PurebredCount = NumberOfImages - 1;
ImageWidth = 432;
StartBones = 3;
Rotations = 4;
InitialSpinDuration = 400;
MidSpinDuration = 13600;
EndSpinDuration = 1800;
TopOffset = 200;
SpinDuration = 3200;

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
	this.context = { bone_id: this.boneId };
	this.html    = bone_template(this.context);
	this.boneBank = $('.incoming'); // TODO: move after doc loads
}

Bone.prototype = {

	add: function() {
		this.boneBank.prepend( this.html );
		this.el = $('#bone_' + this.boneId);
		this.el.css({ top: '-200px' }).animate({ 
      top: "+=600px",
    },
    750);
	},

	remove: function() {
		this.el.animate({ 
      top: "+=800px",
    }, 500 ).hide(1000);
	}
};

function rainBone() {
	var boneImage, boneX, boneWidth, time, bone;
	var screenHeight = $(document).height();
	var startY = -0.2 * screenHeight;
	var endY = 1.4 * screenHeight;
	boneWidth = Math.random() * 100 + 20;
	time = 2000;
	boneX = Math.random() * ($(document).width() - boneWidth);
	boneImage = bone_template({bone_id: "rain"});
	bone = $(boneImage).appendTo('body');
	bone.css({
		width: boneWidth + 'px',
		top: startY + 'px' ,
		left: boneX + 'px'
	})
	.addClass('rain')
	.animate({
    top: "+=" + endY + "px",
  },
  {duration: time,
  	easing: 'swing',
  	complete: function() { 
  		this.remove();
  	}
  });
}

function NameArea( node ) {
	this.names = node.children();
	this.activeEl = null;
}

NameArea.prototype = {
  display: function( newPos ) {
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
	this.top = top;
	this._bg = null;
	this._pos = null;
	this.goLeft = 1;
	this.spinning = false;
	this.callback = callback;
	this.updatePositions(); // TBD can you call this here?
}

Reel.prototype = {

	bg: function() {
		var coords = this.el.css("backgroundPosition").split(" ");
		for (var i=0; i<coords.length; i++){
			coords[i] = parseFloat(coords[i]);
		}
		return coords;
	},

	pos: function() {
		return Math.abs((NumberOfImages - Math.round(this._bg[0] / ImageWidth) % (NumberOfImages * this.goLeft)) % NumberOfImages) + 1;
	},

	updatePositions: function() {
		this._bg = this.bg();
		this._pos = this.pos();
	},

	initialSpin: function() {
		// Rotate one full time around
		var that = this;
		var bgX = this._bg[0] - (this.goLeft * (Math.random() * NumberOfImages % 2) * ImageWidth );

		this.spinning = true;
		this.el.delay(!this.top * TopOffset).animate(
			{ backgroundPosition: bgX + 'px ' + that._bg[1] + 'px' },
			InitialSpinDuration - (this.top * TopOffset),
			"swing",
			this.midSpin.bind(that)
		);
	},

	midSpin: function() {
		var bgX, that = this;
		
		// Update positions and attach event handlers
		this.updatePositions();
		this.el.on("mousedown", function(event) {
			event.preventDefault();
			event.stopPropagation();
			that.el.stop(); // stop midspin animation
			that.endSpin();
		});

		bgX = -(this.goLeft * NumberOfImages * ImageWidth * Rotations - this._bg[0]);

		this.el.animate(
			{ backgroundPosition: bgX + 'px ' + that._bg[1] + 'px' },
			MidSpinDuration - (12 * this.top * TopOffset),
			"linear",
			that.endSpin.bind(that)
		);
	},

	endSpin: function() {
		var bgX, that = this;
		
		// Update position and remove event handlers
		this.updatePositions();
		this.spinning = false;
		this.el.off("mousedown");

		// Play sound
		ion.sound.play("tap");

		// Change spin direction for next go
		this.goLeft = -this.goLeft;
		
		// Calculate end spin position
		bgX = this._bg[0];
		bgX -= this.remainingRotation();
		bgX -= 2 * (-this.goLeft * ImageWidth); // add two more rotations

		if (DebugMode === 1) {
			if (debugIndex < 2) {
				bgX = 0;
				debugIndex++;
			}
		} else if (DebugMode === 2 || DebugMode === 4) {
			bgX = Math.floor((debugIndex-1)/2) * ImageWidth;
			debugIndex--;
		} else if (DebugMode === 3) {
			bgX = (debugIndex % 2 === 0) ? ImageWidth : bgX;
			debugIndex++;
		}

		// Advance reel to end spin position
		this.el.animate(
			{ backgroundPosition: bgX + 'px ' + that._bg[1] + 'px' },
			EndSpinDuration,
			"easeOutQuint",
			function() {
				that.updatePositions();
				that.callback(that._pos, that.top );
				that.updatePositions();
			}
		);
	},

	finalPos: function() {
 		return Math.floor( ( Math.random() * NumberOfImages ) ) + 1;
  },

  remainingRotation: function() {
  	return this._bg[0] % ImageWidth;
  },

  refreshPosition: function(position) {
  	var bgX = ( 1 - position ) * ImageWidth;
  	this.el.css(
  		{'backgroundPosition': bgX + 'px ' + this._bg[1] + 'px'}
		);
		this.updatePositions();
  }
};

function Slot(els, boneEl, controlEl, nameEl ) {
	this.reels = [ new Reel( $(els[0]), true, this.callback.bind(this) ), new Reel( $(els[1]), false, this.callback.bind(this) ) ];
	this.positions = [0,0];
	this.bones = [];
	this.nextBoneId = 0;
	this.boneTally = 0;
	this.boneTallyArea = boneEl;
	this.control = controlEl;
	this.nameArea = new NameArea( nameEl );
	this.activeVideo = null;
	this.goLeft = 1;
	this.trophies = [];
	this.spinningReels = 0;
	this.bowl = $('.bowl');
	this.setUpGame();
}

Slot.prototype = {

	setUpGame: function() {
		var that = this;
		// add start bones
		this.addBones(StartBones);
		// set up click & "s" key controller
		this.control.click( function() {
		  that.start();
		});

		this.clearDogName();

		if (DebugMode === 4 || DebugMode === 5) {
			for (var i=1; i<=PurebredCount; i++){
				if (i != 2) {
					this.positions = [i,i];
					this.win();
				}
			}
		}

		// event handlers for end-game
		$(document).on('click', '#start_over', function(event){
	  	event.stopPropagation();
	  	console.log('starting over');
	  	that.restart();
	  	that.playSound('game start');
	  	$('#overlay, .modal').remove();
	  });
	  $(document).on('click', '#get_more_bones', function(event){ 
	  	event.stopPropagation();
	  	console.log('getting more bones');
	  	that.addBones(StartBones);
	  	that.enableControls();
	  	that.playSound('register');
	  	$('#overlay, .modal').remove();
	  });
	},

	start: function() {
		var that = this, bgX, bgY, rotation;
		this.stopVideo();
		this.playSound('coin');
		this.removeBone();
		this.disableControls();
		this.clearDogName();
		this.positions = [0,0];

		// spin reels
		this.spinningReels = 2;
		this.reels[0].initialSpin();
		this.reels[1].initialSpin();
			// bgX = rotation - ( ImageWidth * (finalPos[index] - 1) );
			// bgY = -300*index;
	},

	callback: function(finalPos, top) {
		var that = this;
		var index = top ? 0 : 1;
		this.positions[index] = finalPos;
		this.spinningReels--;

		if (this.spinningReels === 0) {
			this.setDogName();

			if (this.winner()) {
				this.win();
				this.enableControls();
			} else if ((!this.winner()) && this.boneTally === 0) {
				setTimeout(function() { that.gameOver(); }, 600);
			} else {
				this.enableControls();
			}

			if (this.trophies.length == PurebredCount) {
				setTimeout(function() { that.endGameWithWin(); }, 4500);
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
 		if ( this.trueMatch() ) {
	 		var match = this.positions[0];
	 		if (this.trophies.indexOf(match) === -1) {
	 			this.trophies.push(match);
	 			$('.trophy[data-id="'+match+'"]').css({
			     '-webkit-transform' : 'rotateY(-1440deg)',
			     '-moz-transform' : 'rotateY(-1440deg)',  
			      '-ms-transform' : 'rotateY(-1440deg)',  
			       '-o-transform' : 'rotateY(-1440deg)',  
			          'transform' : 'rotateY(-1440deg)'
	 			}).addClass('earned');
	 		}

	 		if ( (DebugMode != 4 && DebugMode != 5) || this.positions[0] === 2) {
	 			this.playVideo(this.positions[0]);
	 			this.rainBones(150);
	 		}
	 		if (DebugMode === 5) {
	 			for(var i=0; i < this.boneTally-1; i++) {
	 				this.removeBone();
	 			}
	 		}
	 	} else {
	 		this.rainBones(200);
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
		
		VideoEl.removeClass('hide');
		activeVideo = this.activeVideo = $('video[data-id="' + videoIndex + '"]').removeClass('hide');
 		activeVideo.get(0).play();
 		activeVideo.get(0).addEventListener('ended', function() { 
 			activeVideo.addClass('hide');
 			VideoEl.addClass('hide');
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
  	this.nameArea.display( this.positions );
  },

  clearDogName: function() {
  	this.nameArea.clearOut();
  },

  restart: function() {
  	// remove all bones
  	console.log('restarting');

  	for ( var i=0; i<this.bones.length; i++ ) {
  		this.removeBone();
  	}

  	this.addBones(StartBones);
  	this.trophies = [];
  	$('.trophy').removeClass('earned').css({
			     '-webkit-transform' : 'rotateY(0deg)',
			     '-moz-transform' : 'rotateY(0deg)',  
			      '-ms-transform' : 'rotateY(0deg)',  
			       '-o-transform' : 'rotateY(0deg)',  
			          'transform' : 'rotateY(0deg)'
	 			});
  	this.enableControls();
  },

  gameOver: function() {
  	var trophies = [];
  	this.playSound("FAIL");
  	for (var i=1; i<PurebredCount; i++) {
  		if (this.trophies.indexOf(i+1) > -1) {
  			trophies[i] = 'earned';
  		} else {
  			trophies[i] = '';
  		}
  	}
	  var html = modal_template({trophies: trophies, toys: this.trophies.length, plural: this.trophies.length === 1 ? "Y" : "IES" });
	  $(html).css("opacity","0").appendTo('body');
	  $('#overlay').animate(
	  	{opacity: ".8"},
	  	1000
	  );
	  $('.modal').animate(
	  	{opacity: "1"},
	  	1000
	  );
  },

  disableControls: function() {
  	this.control.prop("disabled", true);
  },

  enableControls: function() {
  	this.control.prop("disabled", false);
  },

  addBone: function(delay) {
  	var that = this;
  	var bone = new Bone( this.nextBoneId );

  	var updateBoneTally = function() {
  		that.boneTallyArea.text( that.boneTally );
  		that.setBowlImage();
  	};

  	var addOne = function(delay) {
			that.bones.unshift( bone );
	 		that.boneTally++;
	  	that.nextBoneId++;
	  	bone.add();
  	};

  	setTimeout( addOne, 200*delay);
  	setTimeout( updateBoneTally, 750 + 200*delay);
	},

  addBones: function(bones) {
  	for ( var j=0; j<bones; j++ ) {
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
  	this.boneTallyArea.text( this.boneTally );
  	this.setBowlImage();
  },

  endGameWithWin: function() {
  	var html = winning_template({toys: this.trophies.length, plural: this.trophies.length === 1 ? "" : "s" });
  	$(html).css("opacity","0").appendTo('body');
  	$('#overlay').animate(
  		{opacity: ".8"},
  		1000
  	);
  	$('.modal').animate(
  		{opacity: "1"},
  		1000
  	);
  },

  rainBones: function(quantity) {
  	for (var i=0; i<quantity; i++) {
  		setTimeout(rainBone, 18*Math.sqrt(i*120));
  	}
  },

  refreshReels: function() {
  	this.reels[0].refreshPosition(this.positions[0]);
  	this.reels[1].refreshPosition(this.positions[1]);
  }
};

$(document).ready(function() {
	// precompile templates
	DebugMode = parseInt($('.debug_mode').val());
	SlotEl = $('.slot');
	VideoEl = $('.video');

	var bone_source   = $("#bone-template").html();
	var modal_source   = $("#modal-template").html();
	var winning_source   = $("#winning-template").html();

	// global variable
	bone_template = Handlebars.compile(bone_source);
	modal_template = Handlebars.compile(modal_source);
	winning_template = Handlebars.compile(winning_source);

	var slot = new Slot( SlotEl, $('.bones'), $('#control'), $('.dogname') );

	function onResize() {
		ImageWidth = SlotEl.width();
		ImageHeight = ImageWidth / 1.44;
		SlotEl.height(ImageHeight + 'px');
		VideoEl.width(ImageWidth + 'px');
		VideoEl.height(ImageHeight * 2 + 'px');
		slot.refreshReels();
	}
	onResize();

	$( window ).resize(function() {
		onResize();
	});
});