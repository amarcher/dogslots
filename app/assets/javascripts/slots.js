// Constants
DebugModes = ["Off","First","AdvanceToWin","WinWithWild"];
var debugIndex = 0;
NumberOfImages = 13;
ImageWidth = 432;
StartBones = 5;
Rotations = 6;
InitialSpinDuration = 400;
MidSpinDuration = 5200;
EndSpinDuration = 1000;
TopOffset = 200;
SpinDuration = 3200;

ion.sound({
  sounds: [
    {name: "dog bark"},
    {name: "register"},
    {name: "success"},
    {name: "coin in slot"},
    {name: "game start"},
    {name: "tap"}
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
	this.boneBank = $('.bone_drop'); // TODO: move after doc loads
}

Bone.prototype = {

	add: function() {
		this.boneBank.prepend( this.html );
		this.el = $('#bone_' + this.boneId);
		this.el.css({ 'top': '-70vh' }).animate({ 
      top: "+=100vh",
      rotateZ: "+=1080"
    }, 500 );
	},

	remove: function() {
		this.el.animate({ 
      top: "+=100vh",
    }, 500 ).hide(1000);
	}
};

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
		var bgX = -(this.goLeft * (NumberOfImages + Math.random() * NumberOfImages - Math.floor(NumberOfImages / 2)) * ImageWidth - this._bg[0]);

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
			bgX = 0;
		} else if (DebugMode === 2) {
			bgX = Math.floor(debugIndex/2) * ImageWidth;
			debugIndex++;
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
			}
		);
	},

	finalPos: function() {
 		return Math.floor( ( Math.random() * NumberOfImages ) ) + 1;
  },

  remainingRotation: function() {
  	return this._bg[0] % ImageWidth;
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

		// event handlers for end-game
		$(document).on('click', '#start_over', function(event){
	  	event.stopPropagation();
	  	console.log('starting over');
	  	that.restart();
	  	that.playSound('game start');
	  	$('#overlay, #modal').remove();
	  });
	  $(document).on('click', '#get_more_bones', function(event){ 
	  	event.stopPropagation();
	  	console.log('getting more bones');
	  	that.addBones(StartBones);
	  	that.enableControls();
	  	that.playSound('register');
	  	$('#overlay, #modal').remove();
	  });
	},

	start: function() {
		var that = this, bgX, bgY, rotation;
		this.stopVideo();
		this.playSound('coin in slot');
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

			if (this.trophies.length == NumberOfImages) {
				console.log('over!');
				setTimeout(function() { that.endGameWithWin(); }, 9000);
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
	 			console.log($('.trophy[data-id="'+match+'"]'));
	 			$('.trophy[data-id="'+match+'"]').css({
			     '-webkit-transform' : 'rotateY(-3240deg)',
			     '-moz-transform' : 'rotateY(-3240deg)',  
			      '-ms-transform' : 'rotateY(-3240deg)',  
			       '-o-transform' : 'rotateY(-3240deg)',  
			          'transform' : 'rotateY(-3240deg)'
	 			}).addClass('earned');
	 		}
	 		this.playVideo(1);
	 	}
 		
 		var payout = this.payout();
 		for (var i=0; i<payout; i++) {
 			this.addBone();
	 	}

	 	this.playSound('success');
 	},

 	playSound: function(name) {
  	ion.sound.play(name);
  },

 	playVideo: function(index) {
 		var activeVideo = this.activeVideo = $('video[data-id="' + index + '"]').show();
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
 		return this.positions[0] === this.positions[1];
 	},

  payout: function() {
  	// double wolf is a mega win 
  	if (this.positions[0] === 13 && this.positions[1] === 13) {
  		return 25;
  	} else {
	  	return 5;
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
  	$('.trophy').removeClass('earned');
  	this.enableControls();
  },

  gameOver: function() {
	  var html = modal_template({toys: this.trophies.length, plural: this.trophies.length === 1 ? "" : "s" });
	  $(html).css("opacity","0").appendTo('body').animate(
	  	{opacity: "0.7"},
	  	1000
	  );
  },

  disableControls: function() {
  	this.control.prop("disabled", true);
  },

  enableControls: function() {
  	this.control.prop("disabled", false);
  },

  addBone: function() {
  	var bone = new Bone( this.nextBoneId );
		this.bones.unshift( bone );
 		this.boneTally++;
  	this.nextBoneId++;
  	bone.add();
 		this.boneTallyArea.text( this.boneTally );
  },

  addBones: function(bones) {
  	for ( var i=0; i<this.bones.length; i++ ) {
  		this.removeBone();
  	}
  	for ( var j=0; j<bones; j++ ) {
  		this.addBone();
  	}
  },

  removeBone: function() {
  	var bone = this.bones.pop();
  	bone.remove();
  	this.boneTally--;
  	this.boneTallyArea.text( this.boneTally );
  },

  endGameWithWin: function() {
  	var html = winning_template({toys: this.trophies.length, plural: this.trophies.length === 1 ? "" : "s" });
  	$(html).css("opacity","0").appendTo('body').animate(
  		{opacity: "0.7"},
  		1000
  	);
  }
};

$(document).ready(function() {
	// precompile templates
	DebugMode = parseInt($('.debug_mode').val());

	var bone_source   = $("#bone-template").html();
	var modal_source   = $("#modal-template").html();
	var winning_source   = $("#winning-template").html();

	// global variable
	bone_template = Handlebars.compile(bone_source);
	modal_template = Handlebars.compile(modal_source);
	winning_template = Handlebars.compile(winning_source);

	var slot = new Slot( $('.slot'), $('.bones'), $('#control'), $('.dogname') );
});