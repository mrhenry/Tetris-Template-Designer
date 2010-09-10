/*
 * Author: Mr. Henry
 * Prefix = ttd_
 *
 */

/* DOM Ready */
$(function(){
  ttd_settings.setup();
});


/* Controllers */
var ttd_settings = {
  
  setup: function(){
    
    // Copy html structure for output later
    var clone = $('#canvas').clone().attr('id', 'clone');
    $('#output-html .template').append(clone);
    
    // Initialize everything
    ttd_canvas.setup();
    ttd_grid.toggle();
    ttd_grid.setCellDimensions();
    ttd_grid.buildGrid($('#w').val(), $('#h').val());
    
    // Input width & height
    $('#w, #h').keyup(function(){
      ttd_grid.setCellDimensions();
    });
    
    // Grid block clicks
    $('#overlay li').live('click', function(){
      $(this).toggleClass('active');
      ttd_grid.createOutput();
    });
    
    // Use local image as guide
    $('#File').change(function(){
      var img = document.getElementById('background');
      var input = $(this)[0];
      img.src = input.files[0].getAsDataURL();
    });
    
    // Show / hide grid
    $('#show-grid').change(function(){
      ttd_grid.toggle();
    });
    
    // Add image
    $('#add-image').click(function(){
      ttd_canvas.addImage();
    });
    
  },
   
};

var ttd_grid = {
  
  setCellDimensions: function(){
    $('#overlay li').css({ 'width': ($('#w').val() - 1) + 'px', 'height': ($('#h').val() - 1) + 'px' });
  },
  
  buildGrid: function(overlay_w, overlay_h){
    var cell_w  = $('#w').val();
    var cell_h  = $('#h').val();
    var grid    = $('#overlay ul');
    var cells   = $('#overlay li');
    
    var cell_fit_w = Math.ceil(overlay_w / cell_w);
    var cell_fit_h = Math.ceil(overlay_h / cell_h);

    var new_cell_count = cell_fit_w * cell_fit_h;
    
    // Resize containers
    $('#overlay ul, #designer, #overlay').css({ 
      'width':  (cell_fit_w * cell_w), 
      'height': (cell_fit_h * cell_h)
    });

    if (new_cell_count > cells.length) {
      // Create new cells
      var diff = new_cell_count - cells.length
      for (i=0; i<diff; i++) {
        grid.append($('<li></li>'));
      }
      $('#overlay li').css({ 
        'width':  (cell_w - 1) + 'px', 
        'height': (cell_h - 1) + 'px'
      });
    } else {
      // Remove cells
      var diff = cells.length - new_cell_count;
      for (i=0; i<diff; i++) {
        $(cells[cells.length - i - 1]).remove();
      }
    }
    ttd_output.grid();
    ttd_output.html();
  },
  
  toggle: function(){
    var overlay = $('#overlay');
    if ($('#show-grid').attr('checked')) {
      overlay.show();
    } else {
      overlay.hide();
    }
  }
  
};

var ttd_canvas = {
  
  setup: function(){
    var canvas    = $('#canvas');
    var editables = $('#canvas hgroup, #canvas p, #canvas .images li');
    
    this.setupImages();
    
    // Drag
    editables.draggable({
      containment: $('#canvas'),
      grid: [5,5],
      drag: function(event, ui){
        ttd_canvas.showInfo($(this));
      },
      stop: function(event, ui){
        ttd_canvas.removeInfo($(this));
      }
    });
    
    // Resize
    editables.hover( // Done in hover to avoid error with canvas resize
      function(){
        $(this).resizable({
          grid: [5,5],
          containment: $('#canvas'),
          resize: function(event, ui){
            ttd_canvas.showInfo($(this));
          },
          stop: function(event, ui){
            ttd_canvas.removeInfo($(this));
          }
        });
      },
      function(){}
    );
    
    canvas.resizable({
      resize: function(event, ui){
        ttd_grid.buildGrid(ui.size.width, ui.size.height);
      },
      stop: function(event, ui){
        ttd_grid.buildGrid(ui.size.width, ui.size.height);
      }
    });
    
  },
  
  resize: function(w, h){
    $('#canvas').css({ 'width': w + 'px', 'height': h + 'px' });
  },
  
  showInfo: function(el){
    var info;
    if (el.find('.info').length > 0) {
      info = el.find('.info')
    } else {
      info = $('<span></span>');
      info.appendTo(el).hide();
    }
    
    var pos_x = el.css('left');
    var pos_y = el.css('top');
    var el_w  = el.css('width');
    var el_h  = el.css('height');
    
    var text  = 'x: ' + el.css('left') + ' y: ' + el.css('top') + '<br>w: ' + el.css('width') + ' h: ' + el.css('height');;
    
    info.addClass('info')
        .html(text)
        .show();
  },
  
  removeInfo: function(el){
    //$('.info').remove();
  },
  
  setupImages: function(){
    $('#canvas .images li').each(function(){
      // Set delete button
      var delete_btn;
      if ($(this).find('.delete_btn').length > 0) {
        delete_btn = $(this).find('.delete_btn');
      } else {
        delete_btn = $('<span></span>');
        delete_btn.addClass('delete_btn')
                  .attr('title','Delete this image')
                  .appendTo($(this));
      }
      // Set ratio button
      var ratio_btn;
      if ($(this).find('.ratio_btn').length > 0) {
        ratio_btn = $(this).find('.ratio_btn');
      } else {
        ratio_btn = $('<span></span>');
        ratio_btn.addClass('ratio_btn')
                 .attr('title','Change ratio')
                 .appendTo($(this));
      }
    });
    
    // Delete button click
    $('.delete_btn').click(function(){
      $(this).closest('li').remove();
    });
    
    // Ratio button click
    $('.ratio_btn').click(function(){
      ttd_canvas.setImageRatio($(this));
    });
  },
  
  setImageRatio: function(el){
    var image      = el.closest('li');
    var ratio_text = el.siblings('.ratio');
    var ratios = [
      {'name': '2x3',  'width': 120, 'height': 180 },
      {'name': '3x2',  'width': 180, 'height': 120 }, 
      {'name': '3x4',  'width': 120, 'height': 160 }, 
      {'name': '4x3',  'width': 160, 'height': 140 }, 
      {'name': '16x9', 'width': 160, 'height': 90  }, 
      {'name': '9x16', 'width': 90,  'height': 160 }, 
      {'name': '1x1',  'width': 100, 'height': 100 }
    ];
    var current_ratio_idx = parseInt(ratio_text.attr('rel'));
    var next_radio_idx;
    var new_ratio;
    
    // Get new ratio
    if (current_ratio_idx == (ratios.length - 1)) {
      new_ratio_idx = 0;
    } else {
      new_ratio_idx = current_ratio_idx + 1;
    }
    new_ratio = ratios[new_ratio_idx];
    
    // Adjust image
    image.css({
      'width':  new_ratio.width,
      'height': new_ratio.height
    });
    ratio_text.html(new_ratio.name)
              .attr('rel', new_ratio_idx);
    
    // Reload events
    image.resizable('destroy')
         .resizable({
      aspectRatio: new_ratio.name.replace('x','/'),
      grid: [5,5],
      containment: $('#canvas'),
      resize: function(event, ui){
        ttd_canvas.showInfo($(this));
      },
      stop: function(event, ui){
        ttd_canvas.removeInfo($(this));
      }
    });
  },
  
  addImage: function(){
    var images      = $('#canvas .images li');
    var idx         = images.length;
    var ratio_text  = $('<span></span>').addClass('ratio').attr('rel', 0).html('2x3');
    var id          = $('<span></span>').addClass('id').html(idx + 1);
    var li          = $('<li></li>').addClass('img-' + idx + 1).append(id).append(ratio_text);
    
    $('#canvas .images').append(li);
    ttd_canvas.setup();
  }
}

var ttd_output = {
  
  grid: function(){
    var cell_fit_w  = $('#overlay ul').width() / $('#w').val();
    var output      = [cell_fit_w, []]; // This is a for the tetris.js script
    
    // Check cell status
    $('#overlay li').each(function(){
      var value = 0;
      if ($(this).hasClass('active')) {
        value = 1;
      }
      output[1].push(value);
    });
    
    // Write output
    $('#output-grid code').html('[' + output[0].toString() + ', [' + output[1].toString() + ']]');
  },
  
  html: function(){
    var template = $('#output-html .template #clone').clone();
    var images   = $('#canvas .images li');
    
    // Place images
    template.find('.images li').remove();
    for (i=0;i<images.length;i++) {
      template.find('.images').append($('<li></li>').addClass('img-' + (i + 1)));
    }
    
    // Wipe previous output
    $('#output-html code').html('');
    template.attr('id','').addClass('template-x').appendTo('#output-html code');
    var output = $('#output-html code').html().replace(/</gm, '&lt;').replace(/>/gm, '&gt;').replace(/\n/gm, '<br>');
    $('#output-html code').html(output);
  }
  
}
