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
    
    // Input width & height
    $('#w, #h').keyup(function(){
      ttd_grid.setup();
      ttd_settings.save();
    });
    
    // Use local image as background guide
    $('#File').change(function(){
      var img   = $('#background');
      var input = $(this)[0];
      img.attr('src', input.files[0].getAsDataURL());
    });
    
    // Remove background image
    $('.background-image .remove').click(function(e){
      e.preventDefault();
      $('#background').attr('src','');
      $('#File').val('');
    });
    
    // Show / hide grid
    $('#show-grid').change(function(){
      ttd_grid.toggle();
    });
    
    // Add image
    $('#add-image').click(function(e){
      e.preventDefault();
      ttd_canvas.addImage();
    });
    
    // CSS format
    $('.css-format input, .css-format label').click(function(){
      ttd_output.write();
    });
    
    // Copy to clipboard
    $('.output .select').click(function(e){
      e.preventDefault();
      var range = document.createRange();
      range.selectNode($(this).siblings('code')[0]);
      window.getSelection().addRange(range);
    });
    
    // Load template
    $('.load-template button').click(function(e){
      e.preventDefault();
      var grid_input  = $('input[name=output-grid]').val();
      var css_input   = $('textarea[name=output-css]').val();
    });
    
    // Initialize everything
    this.load();
    
    ttd_grid.setup();
    ttd_canvas.setup();
  },
  
  load: function(){
    var settings;
    if ($.cookie('ttd_settings')) {
      settings = JSON.parse($.cookie('ttd_settings'));
      $('#w').val(settings.grid_cell_width);
      $('#h').val(settings.grid_cell_height);
    } else {
      this.save_settings();
    }
  },
  
  save: function(){
    settings = JSON.stringify({
                 grid_cell_width: $('#w').val(),
                 grid_cell_height: $('#h').val()
               });
    $.cookie('ttd_settings', settings, { expires: 7 });
  }
  
};

var ttd_grid = {
  
  setup: function(){
    ttd_grid.toggle();
    ttd_grid.setCellDimensions();
    ttd_grid.buildGrid(parseInt($('#canvas').css('width').replace('px', '')), parseInt($('#canvas').css('height').replace('px', '')));
    
    // Selectable grid blocks
    $('#overlay ul').selectable({
      stop: function(){
        $('.ui-selected').each(function(){
          $(this).toggleClass('active');
        });
      }
    });
    
  },
  
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
    
    var diff;
    if (new_cell_count > cells.length) {
      // Create new cells
      diff = new_cell_count - cells.length;
      for (i=0; i<diff; i++) {
        grid.append($('<li></li>'));
      }
      $('#overlay li').css({ 
        'width':  (cell_w - 1) + 'px', 
        'height': (cell_h - 1) + 'px'
      });
    } else {
      // Remove cells
      diff = cells.length - new_cell_count;
      for (i=0; i<diff; i++) {
        $(cells[cells.length - i - 1]).remove();
      }
    }
    
    // Write output
    ttd_output.write();
  },
  
  toggle: function(){
    var overlay = $('#overlay');
    if (overlay.is(':visible')) {
      overlay.hide();
      $('#show-grid').attr('checked', '');
    } else {
      overlay.show();
      $('#show-grid').attr('checked', 'checked');
    }
    //if ($('#show-grid').attr('checked')) {
    //  overlay.show();
    //} else {
    //  overlay.hide();
    //}
  },
  
  getWidth: function(){
    // We have to show the grid, otherwise we can't measure it..
    $('#overlay').show();
    var width = $('#overlay ul').width();
    if (!$('#show-grid').attr('checked')) {
      $('#overlay').hide();
    }
    return width;
  }
};

var ttd_canvas = {
  
  setup: function(){

    // Resize canvas
    $('#canvas').resizable({
      resize: function(event, ui){
        ttd_grid.buildGrid(ui.size.width, ui.size.height);
      },
      stop: function(event, ui){
        ttd_grid.buildGrid(ui.size.width, ui.size.height);
      }
    });
    
    this.setupImages();
    
    // Drag
    $('#canvas hgroup, #canvas .intro, #canvas .images li').draggable({
      containment: $('#canvas'),
      grid: [5,5],
      drag: function(event, ui){
        ttd_canvas.showInfo($(this));
      },
      stop: function(event, ui){
        ttd_canvas.removeInfo($(this));
        ttd_output.write();
      }
    });
    
    // Resize title & paragraph
    $('#canvas hgroup, #canvas .intro').mouseenter( // Done in hover to avoid error with canvas resize
      function(){
        $(this).resizable({
          grid: [5,5],
          containment: $('#canvas'),
          resize: function(event, ui){
            ttd_canvas.showInfo($(this));
          },
          stop: function(event, ui){
            ttd_canvas.removeInfo($(this));
            ttd_output.write();
          }
        });
      }
    );
    
  },
  
  resize: function(w, h){
    $('#canvas').css({ 'width': w + 'px', 'height': h + 'px' });
  },
  
  showInfo: function(el){
    var info;
    if (el.find('.info').length > 0) {
      info = el.find('.info');
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
        .show()
        .delay(10000)
        .fadeOut(300);
  },
  
  removeInfo: function(el){
    //$('.info').remove();
  },
  
  setupImages: function(){
    $('#canvas .images li').each(function(){
      
      ttd_canvas.setImageRatio($(this));
      
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
      ttd_canvas.changeImageRatio($(this).closest('li'));
    });
  },
  
  setImageRatio: function(el){
    var image      = el;
    var ratio_text = image.find('.ratio');
    var ratios     = this.ratios();
    var current_ratio_idx = parseInt(ratio_text.attr('rel'), 10);
    
    // Reload events
    image.resizable('destroy')
         .resizable({
            aspectRatio: ratios[current_ratio_idx].name,
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
  
  changeImageRatio: function(el){
    var image      = el;
    var ratio_text = image.find('.ratio');
    var ratios = this.ratios();
    var current_ratio_idx = parseInt(ratio_text.attr('rel'), 10);
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
            aspectRatio: new_ratio.name,
            grid: [5,5],
            containment: $('#canvas'),
            resize: function(event, ui){
              ttd_canvas.showInfo($(this));
            },
            stop: function(event, ui){
              ttd_canvas.removeInfo($(this));
            }
    });
    
    ttd_output.write();
  },
  
  addImage: function(){
    var images      = $('#canvas .images li');
    var idx         = images.length;
    var ratio_text  = $('<span></span>').addClass('ratio').attr('rel', 0).html('2/3');
    var id          = $('<span></span>').addClass('id').html(idx + 1);
    var li          = $('<li></li>').addClass('img-' + (idx + 1)).append(id).append(ratio_text);
    
    $('#canvas .images').append(li);
    
    this.setup();
    ttd_output.write();
  },
  
  ratios: function(){
    return [
      {'name': '2/3',  'width': 120, 'height': 180 },
      {'name': '3/2',  'width': 180, 'height': 120 }, 
      {'name': '3/4',  'width': 120, 'height': 160 }, 
      {'name': '4/3',  'width': 160, 'height': 120 }, 
      {'name': '16/9', 'width': 160, 'height': 90  }, 
      {'name': '9/16', 'width': 90,  'height': 160 }, 
      {'name': '1/1',  'width': 100, 'height': 100 }
    ];
  }
};

var ttd_output = {
  
  write: function(){
    this.grid();
    this.html();
    this.css();
  },
  
  grid: function(){
    var cell_fit_w  = ttd_grid.getWidth() / $('#w').val();
    var ratios      = ttd_canvas.ratios();
    var output      = [cell_fit_w, [], [], [$('#w').val(), $('#h').val()]]; // This is the pattern for the tetris.js script [horizontal cell count, [grid pattern], [image ratios], [grid cell width, grid cell height]]
    
    // Check cell status
    $('#overlay li').each(function(){
      var value = 0;
      if ($(this).hasClass('active')) {
        value = 1;
      }
      output[1].push(value);
    });
    
    // Get image ratios
    $('#canvas .images li').each(function(){
      var ratio = parseInt($(this).find('.ratio').attr('rel'), 10);
      output[2].push('\'' + ratios[ratio].name + '\'');
    });
    
    // Write output
    $('#output-grid code').html('[' + output[0].toString() + ', [' + output[1].toString() + '], [' + output[2] + '], [' + output[3] + ']]');
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
  },
  
  css: function(){
    var format = $('.css-format input:radio:checked').val();
    
    $.get('templates/template.' + format, function(data){
      // Get elements info
      var template    = $('#canvas');
      var hgroup      = template.find('hgroup');
      var paragraph   = template.find('.intro');
      var images      = []; 
      
      // Get image info
      template.find('.images li').each(function(){
        var id = $(this).attr('class').match(/img-\d*/);
        images.push({
          id: id[0],
          top: $(this).css('top'),
          left: $(this).css('left'),
          width: $(this).css('width'),
          height: $(this).css('height')
        });
      });
      
      // Prepare mustache 
      var view = {
        template_width    : template.css('width'),
        template_height   : template.css('height'),
        hgroup_top        : hgroup.css('top'),
        hgroup_left       : hgroup.css('left'),
        hgroup_width      : hgroup.css('width'),
        hgroup_height     : hgroup.css('height'),
        paragraph_top     : paragraph.css('top'),
        paragraph_left    : paragraph.css('left'),
        paragraph_width   : paragraph.css('width'),
        paragraph_height  : paragraph.css('height'),
        images: images
      };
      var output = Mustache.to_html(data, view);
      $('#output-css code').html(output.replace(/\n/gm, '<br>').replace(/\t/gm, '&nbsp;&nbsp;'));
    });

  }
  
};