// from https://twitter.com/koreapyj/status/950706028160565248 
// src https://github.com/koreapyj/elevatorsaga-dumb / elevator.js 
( { 
	  waitUntilFull : false 
	, stopWhenAvailable : false 
	, init : function( elevators, floors ) { 
		waitUntilFull = this .waitUntilFull; 
		console .log( elevators ); 
		for( i = 0; i < elevators .length; i++ ) { 
			elevators[ i ] .index = i; 
			} 
		_ .each( elevators, elevator => { 
			Object .assign( elevator, { 
				  floorsToUp : [] 
				, floorsToDown : [] 
				, floorsToStop : [] 
				} ); 
			
			elevator .move = q => { 
				var 
					  minFloor = floors .length + 1 
					, maxFloor = -1 
					; 
				for ( i = floors .length; i--; ) { 
					if ( [ 'floorsToStop', 'floorsToUp', 'floorsToDown' ] .some( f => elevator[ f ][ i ] ) ) { 
						maxFloor = maxFloor < i ? i : maxFloor; 
						minFloor = minFloor > i ? i : minFloor; 
						} 
					} 
				
				if ( waitUntilFull ) { 
					if ( 
							   ( elevator .currentFloor() == 0 && elevator .loadFactor() < 0.7 ) 
							|| ( elevator .currentFloor() != 0 && elevator .loadFactor() == 0 ) 
							) { 
						Object .assign( elevator, { 
							  status : 'waiting' 
							, timer : ( 
								  clearTimeout( elevator .timer ) 
								, setTimeout( q => elevator .move(), 1000 ) 
								) 
							} ); 
						return; 
						} 
					} 
				
				elevator .status = null; 
				var stopFloor = -1; 
				[ 
					  [ 'goingUpIndicator', 'maxinum', maxFloor ]
					, [ 'goingDownIndicator', 'minimum', minFloor ] 
					] 
				.some( ( [ g, t, f ] ) => { 
					if ( ! elevator[ g ]() ) 
						{ return; } 
					elevator .destinationQueue .pop(); 
					console .log( `EV${ elevator .index }: Go to ${ f } (${ t })` ); 
					elevator .destinationQueue .push( f ); 
					} ) 
				// else 
				|| console .log( elevator ) 
					; 
				elevator .checkDestinationQueue(); 
				}; // -- .move 
			
			elevator .on( "floor_button_pressed", floorNum => { 
				elevator .floorsToStop[ floorNum ] = true; 
				elevator .move(); 
				} ); // -- .on( 'floor_button_pressed' ) 
			
			var 
				goElevator = ( elevator, ingUpIndicator, ingDownIndicator, ToFloor ) => {
					[ [ 'goingUpIndicator', ingUpIndicator ], [ 'goingDownIndicator', ingDownIndicator ] ] .forEach( 
						( [ f, q ] ) => elevator[ f ][ i ] ? q[ 0 ] .push( i ) : 0 
						); 
					if ( ToFloor !== undefined ) { 
						elevator .goToFloor( ToFloor ); 
						} 
					} 
				; 
			
			elevator .on( "idle", q => { 
				console .log( `Elevator idle (${ elevator .maxPassengerCount() })` ); 
				goElevator( elevator, false, false ); 
				
				var 
					  upQueue = [ [], [] ] 
					, downQueue = [ [], [] ] 
					, [ minFloor, maxFloor ] = [ floors .length + 1, -1 ] 
					; 
				for ( i = elevator .currentFloor(); i--; ) { 
					[ [ 'floorsToDown', downQueue ], [ 'floorsToUp', upQueue ] ] .forEach( 
						( [ f, q ] ) => elevator[ f ][ i ] ? q[ 0 ] .push( i ) : 0 
						); 
					if ( 
								[ 'floorsToDown', 'floorsToUp' ] .some( f => elevator[ f ][ i ] ) 
							&& minFloor > i 
							) { 
						minFloor = i; 
						} 
					} 
				for ( i = elevator .currentFloor(); i < floors .length; i++ ) { 
					[ [ 'floorsToDown', downQueue ], [ 'floorsToUp', upQueue ] ] .forEach( 
						( [ f, q ] ) => elevator[ f ][ i ] ? q[ 1 ] .push( i ) : 0 
						); 
					if ( 
								[ 'floorsToDown', 'floorsToUp' ] .some( f => elevator[ f ][ i ] ) 
							&& maxFloor < i 
							) { 
						maxFloor = i; 
						} 
					} 
				var 
					// weight if to down needs 
					  toDown = [ upQueue, downQueue ] 
						.map( a => [ a[ 0 ] .length, a[ 1 ] .length ] ) 
						.reduce( ( [ [ a0, a1 ], [ b0, b1 ] ] ) => a0 + b0 > a1 + b1 ) 
					, toFloor = toDown ? minFloor : maxFloor 
					; 
				goElevator( elevator, toDown, ! toDown, toFloor ); 
				} ); // -- .on( 'idle' ) 
			
			elevator .on( "stopped_at_floor", q => { 
				var 
					  floorNum = elevator .currentFloor() 
					, needToMoveMore = false 
					; 
				if ( floorNum == 0 ) { 
					goElevator( elevator, true, false ); 
					} 
				else if( floorNum == floors .length - 1 ) { 
					goElevator( elevator, false, true ); 
					} 
				else { 
					if( elevator .goingUpIndicator() ) { 
						for( i = elevator .currentFloor(); ++i < floors .length; ) { 
							if( [ 'floorsToUp', 'floorsToDown', 'floorsToStop' ] .some( f => elevator[ f ][ i ] ) ) { 
								needToMoveMore = true; 
								} 
							} 
						if( ! needToMoveMore ) { 
							goElevator( elevator, false, true ); 
							} 
						} 
					else if( elevator .goingDownIndicator() ) { 
						for( i = elevator .currentFloor(); i--; ) { 
							if ( [ 'floorsToUp', 'floorsToDown', 'floorsToStop' ] .some( f => elevator[ f ][ i ] ) ) { 
								needToMoveMore = true; 
								} 
							} 
						if( ! needToMoveMore ) { 
							goElevator( elevator, true, false ); 
							} 
						} 
					} 
				if ( elevator .goingUpIndicator() ) { 
					elevator .floorsToUp[ floorNum ] = false; 
					} 
				else if( elevator .goingDownIndicator() ) { 
					elevator .floorsToDown[ floorNum ] = false; 
					} 
				elevator .floorsToStop[ floorNum ] = false; 
				} ); // -- .on( 'stopped_at_floor' ) 
			
			elevator .on( "passing_floor", ( floorNum, direction ) => { 
				[ [ 'up', 'floorsToUp' ], [ 'down', 'floorsToDown' ] ] 
				.some( ( [ d, f ] ) => { 
					if ( 
						   direction === d 
						&& elevator[ f ][ floorNum ] 
						) { 
						if ( elevator .loadFactor() < 0.5 ) { 
							console .log( `EV${ elevator .index }: Stop at ${ floorNum } (waiting passenger)` ); 
							elevator .destinationQueue .unshift( floorNum ); 
							} 
						else { 
							findBestElevator( floorNum, 'up' ); 
							elevator[ f ][ floorNum ] = false; 
							} 
						
						return true; 
						}
					} ) 
				|| [ 'floorsToStop' ] .some( f => { 
					if ( elevator[ f ][ floorNum ] ) { 
						console .log( `EV${ elevator .index }: Stop at ${ floorNum } (button pressed)` ); 
						elevator .destinationQueue .unshift( floorNum ); 
						} 
					} ) 
					; 
				elevator .checkDestinationQueue(); 
				} ); // -- .on( 'passing_floor' ) 
			} ); // -- _ .each( elevators ) 
		
		var findBestElevator = ( floor, direction ) => { 
			var 
				  bestElevator = -1 
				, bestElevatorByDistance = -1 
				, bestElevatorByCapacity = -1 
				, bestCapacity = -1 
				, bestDistance = floors .length * 3 
				; 
			for ( i = elevators .length; i--; ) { 
				elevator = elevators[ i ]; 
				sameDirection = 
					   ( direction == 'up' && elevator .goingUpIndicator() ) 
					|| ( direction == 'down' && elevator .goingDownIndicator() ) 
					; 
				neededDirection = ( elevator .currentFloor() < floor .level ? 'up' : 'down' ) == direction; 
				if ( 
						   neededDirection 
						&& sameDirection 
						&& bestCapacity < elevator .maxPassengerCount() 
						) { 
					if ( elevator .floorsToStop .slice( elevator .currentFloor(), floor .level ) .indexOf( true ) != -1 ) { 
						bestElevator = i; 
						bestCapacity = elevator .maxPassengerCount(); 
						} 
					} 
				if( ! sameDirection ) { 
					distance = 
						  Math .abs( elevator .currentFloor() - elevator .destinationQueue .slice( -1 )[ 0 ] ) 
						+ Math .abs( floor .level - elevator .destinationQueue .slice( -1 )[ 0 ] ) 
						; 
					} 
				else { 
					distance = 
						  Math .abs( elevator .destinationQueue .slice( -1 )[ 0 ] - elevator .currentFloor() ) 
						+ floors .length 
						+ floor .level 
						;
					} 
				if ( distance < bestDistance ) { 
					bestElevatorByDistance = i; 
					bestDistance = distance; 
					} 
				} 
			[ [ bestElevator, 'on the road' ], [ bestElevatorByDistance, 'best selection by distance' ] ] 
			.some( ( [ v, t ] ) => { 
				if ( v != -1 ) { 
					elevators 
						[ v ] 
						[ direction === 'up' ? 'floorsToUp' : 'floorsToDown' ] 
						[ floor .level ] = true 
						; 
					elevators[ v ] .move(); 
					console .log( `EV${ elevator .index }: will go to floor ${ floor .level } (${ t }/${ direction })` ); 
					return true; 
					} 
				} ); 
			}; // -- findBestElevator 
		
		_ .each( floors, floor => { 
			floor .on( "up_button_pressed", floor => findBestElevator( floor, 'up' ) ); 
			floor .on( "down_button_pressed", floor => findBestElevator( floor, 'down' ) ); 
			} ); 
		} // -- .init 
	, update : ( dt, elevators, floors ) => {
		// We normally don't need to do anything here
		}
	} ) 
