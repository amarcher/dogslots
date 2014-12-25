$(document).ready(function() {
	NumberOfImages = 9;
	ImageWidth = 432;

	ion.sound({
	    sounds: [
	        {
	            name: "door_bell"
	        }
	    ],
	    volume: 1,
	    path: "sounds/",
	    preload: true
	});

	function Slot(els, winEl) {
		this.reels = els;
		this.positions = [0,0];
		this.winTallyArea = winEl;
		this.winCount = 0;
	}

	Slot.prototype = {

		start: function(finalPos) {
			var _this = this;
			$.each( this.reels, function( index, value ){
				$(value).animate(
					{
						backgroundPositionX: 10*finalPos[index]*ImageWidth + 'px'
					},
					3800,
					"easeOutQuint",
					function() {
						if ( index == _this.reels.length - 1 ) // last reel stopped spinning
							_this.stop(finalPos);
					}
				);
			});
		},

		stop: function(finalPos) {
			if (finalPos) {
				this.positions = finalPos;
			} else {
				// find final position
			}
			if (this.positions[0] == this.positions[1]) {
				this.winner();
			}
	 	},

	 	winner: function() {
	 		this.winCount += 1;
	 		this.winTallyArea.text(this.winCount);
 			ion.sound.play("door_bell");
 			setTimeout(function() {
 				ion.sound.play("door_bell");
 			}, 500);
	 	},

	 	finalPos: function() {
	 		var newPostions = [];
	 		for ( var i=0, len=this.reels.length; i < len; i++ ) {
	 			newPostions.push( Math.floor( (Math.random() * NumberOfImages) + 1 ) );
 	    }
 	    return newPostions;
 	  }
	};

	var slot = new Slot( $('.slot'), $('.wins') );

	/**
	* Slot machine controller
	*/
	$('#control').click(function() {
	  slot.start(slot.finalPos());
	});
});