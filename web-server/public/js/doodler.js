var VARS = new Array();


$( document ).ready( function() {

	$( '#btn_script_execute' ).click( function() {

		draw_execute();
	});


	$( '#btn_script_clear' ).click( function() {

		$( '#commands' ).val( '' );
	});


	$( '#btn_script_example' ).click( function() {

		var script_example = new Array();

		script_example.push( 'ink yellow' );
		script_example.push( 'clear' );
		script_example.push( '' );
		script_example.push( 'ink blue' );
		script_example.push( 'box 0 50 300 50' );
		script_example.push( '' );
		script_example.push( 'ink green' );
		script_example.push( 'spirograph 70 75 30 10 1' );
		script_example.push( 'spirograph 200 75 50 20 2' );
		script_example.push( '' );
		script_example.push( 'ink red' );
		script_example.push( 'set y 30' );
		script_example.push( 'loop 3' );
		script_example.push( '  set x 30' );
		script_example.push( '  loop 5' );
		script_example.push( '    circle $x $y 10' );
		script_example.push( '    add x 60' );
		script_example.push( '  end' );
		script_example.push( '  add y 45' );
		script_example.push( 'end' );

		$( '#commands' ).val( script_example.join( "\r\n" ) );
	});
});


function evaluate( string ) {

	if( string.charAt( 0 ) == '$' ) {
	
		var key = string.substr( 1 );
		return VARS[ key ];
	}
	
	return string;
}



function draw_execute() {

	$( '#output_log' ).html( '' );
	$( '#command_log' ).html( '' );

	var draw_area = document.getElementById( "draw_area" );
  
	var commands = $( '#commands' ).val();
	
    var settings = {
		draw_2d: draw_area.getContext( "2d" ),
		w: draw_area.width,
		h: draw_area.height,
		ink_colour: current_colour
	};
	var command_lines = commands.split( "\n" );
	commands_execute( command_lines, 0, settings);
    current_colour = settings.ink_colour;
}

var current_colour = '#000000';

function draw_command(commands) {
    var draw_area = document.getElementById( "draw_area" );
	
    var settings = {
		draw_2d: draw_area.getContext( "2d" ),
		w: draw_area.width,
		h: draw_area.height,
		ink_colour: current_colour
	};
	//var command_lines = commands.split( "\n" );
    commands_execute( commands, 0, settings);
    current_colour = settings.ink_colour;
    $("#currInk").html("Current ink is " + current_colour);
}

function commands_execute( commands, stack_depth, settings ) {

	for( line = 0; line < commands.length; line++ ) {
		
		var command_line = $.trim( commands[ line ] );
		if( command_line.length == 0 ) {
		
			continue;
		}
		
		var command_parts = command_line.split( " " );
		if( command_parts.length < 1 ) {
		
			continue;
		}
		
		$( '#command_log' ).append( 'Executing ' + line + ' in stack depth ' + stack_depth  + ': ' + command_line + '<br />' );
		
		switch( command_parts[ 0 ].toLowerCase() ) {

			case 'alert':
				var value = evaluate( command_parts[ 1 ] );
				alert( value );
			break;

			case 'message':
				var value = evaluate( command_parts[ 1 ] );
				$( '#output_log' ).append( '&raquo; ' + value + '<br />' );
			break;
		
			case 'clear':
				settings.draw_2d.fillStyle = settings.ink_colour;
				settings.draw_2d.fillRect( 0, 0, settings.w, settings.h );
			break;
			
			case 'ink':
				var colour_name = evaluate( command_parts[ 1 ] );
				var rgb = rgb_from_colour_name_get( colour_name );
				settings.ink_colour = rgb ? rgb : "#000000";
			break;
			
			case 'box':
				var x = evaluate( command_parts[ 1 ] );
				var y = evaluate( command_parts[ 2 ] );
				var w = evaluate( command_parts[ 3 ] );
				var h = evaluate( command_parts[ 4 ] );
				settings.draw_2d.fillStyle = settings.ink_colour;
				settings.draw_2d.fillRect( x, y, w, h );
			break;

			case 'circle':
				var x = evaluate( command_parts[ 1 ] );
				var y = evaluate( command_parts[ 2 ] );
				var r = evaluate( command_parts[ 3 ] );
				settings.draw_2d.beginPath();
				settings.draw_2d.arc( x, y, r, 0, Math.PI * 2, false );
				settings.draw_2d.closePath();
				settings.draw_2d.fillStyle = settings.ink_colour;
				settings.draw_2d.fill();
			break;
			
			case 'spirograph':
			
				// spirograph 50 50 80 100 2
				var x = Number( evaluate( command_parts[ 1 ] ) );
				var y = Number( evaluate( command_parts[ 2 ] ) );
				var p = evaluate( command_parts[ 3 ] );
				var r1 = evaluate( command_parts[ 4 ] );
				var r2 = evaluate( command_parts[ 5 ] );
				settings.draw_2d.strokeStyle = settings.ink_colour;
				settings.draw_2d.beginPath();
				// TODO- doesn't necessarily return to the same spot...
				for( var t = 0; t < 2 * Math.PI; t += 0.01 ) {
				
					var plot_x = x + ( r1 - r2 ) * Math.cos( t ) + p * Math.cos( ( r1 - r2 ) * t / r2 );
					var plot_y = y + ( r1 - r2 ) * Math.sin( t ) - p * Math.sin( ( r1 - r2 ) * t / r2 );
					if( t == 0 ) {

						settings.draw_2d.moveTo( plot_x, plot_y );
					} else {

						settings.draw_2d.lineTo( plot_x, plot_y );
					}
				}
				settings.draw_2d.closePath();
				settings.draw_2d.stroke();
			break;

			case 'move':
				var x = Number( evaluate( command_parts[ 1 ] ) );
				var y = Number( evaluate( command_parts[ 2 ] ) );
				settings.draw_2d.moveTo( x, y );
			break;

			case 'draw':
				var x = Number( evaluate( command_parts[ 1 ] ) );
				var y = Number( evaluate( command_parts[ 2 ] ) );
				settings.draw_2d.strokeStyle = ink_colour;
				settings.draw_2d.beginPath();
				settings.draw_2d.lineTo( x, y );
				settings.draw_2d.closePath();
				settings.draw_2d.stroke();
			break;

			case 'set':
				var key = command_parts[ 1 ];
				var value = evaluate( command_parts[ 2 ] );
				VARS[ key ] = value;
			break;

			case 'add':
				var key = command_parts[ 1 ];
				var value = evaluate( command_parts[ 2 ] );
				VARS[ key ] = Number( VARS[ key ] ) + Number( value );
			break;

			case 'loop':
				var count = evaluate( command_parts[ 1 ] );
				
				var stack_commands = commands.slice( line + 1 );
				var old_line = line;
				for( var iteration = 0; iteration < Number( count ); iteration ++ ) {
				
					line = old_line + commands_execute( stack_commands, stack_depth + 1, settings ) + 1;
				}
			break;
			
			case 'if':
				var value1 = evaluate( command_parts[ 1 ] );
				var value2 = evaluate( command_parts[ 2 ] );
				
				var stack_commands = commands.slice( line + 1 );
				var old_line = line;
				if( Number( value1 ) === Number( value2 ) ) {
				
					line = old_line + commands_execute( stack_commands, stack_depth + 1, settings ) + 1;
				} else {

					// TODO- (skip lines)
				}
			break;

			case 'end':
				// TODO- check stack depth > 0
				return line;
			break;
		}
	}
}


function rgb_from_colour_name_get( colour_name ) {

	var colours = {
	
		black: '#000000',
		white: '#ffffff',
		red: '#ff0000',
		green: '#00ff00',
		blue: '#0000ff',
		yellow: '#ffff00',
		purple: '#ff00ff',
		cyan: '#00ffff',
	};
	
	return ( colour_name in colours ) ? colours[ colour_name ] : null;
}
