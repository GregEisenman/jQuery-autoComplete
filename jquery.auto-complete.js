/*
	jQuery autoComplete v1.0.6
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/jQuery-autoComplete
	License: http://www.opensource.org/licenses/mit-license.php
*/

(function($){
    $.fn.autoComplete = function(options){
        var o = $.extend({}, $.fn.autoComplete.defaults, options);

        // public methods
        if (typeof options == 'string') {
            this.each(function(){
                var that = $(this);
                if (options == 'destroy') {
                    $(window).off('resize.autocomplete', that.updateSC);
                    that.off('keydown.autocomplete keyup.autocomplete');
                    if (that.data('autocomplete'))
                        that.attr('autocomplete', that.data('autocomplete'));
                    else
                        that.removeAttr('autocomplete');
                    $(that.data('el')).remove();
                    that.removeData('el').removeData('autocomplete');
                }
            });
            return this;
        }

        return this.each(function(){
            var that = $(this);
            // sc = 'suggestions container'
            that.sc = $('<div class="autocomplete-suggestions"></div>').addClass(o.menuClass);
            that.data('el', that.sc).data('autocomplete', that.attr('autocomplete'));
            that.attr('autocomplete', 'off');
            that.cache = {};
            that.last_val = '';

            that.updateSC = function(resize, next){
                that.sc.css({
                    top: that.offset().top + that.outerHeight(),
                    left: that.offset().left //,
                    //width: that.outerWidth()
                });
                if (!resize) {
                    that.sc.show();
                    if (!that.sc.maxHeight) that.sc.maxHeight = parseInt(that.sc.css('max-height'));
                    if (!that.sc.suggestionHeight) that.sc.suggestionHeight = $('.autocomplete-suggestion', that.sc).first().outerHeight();
                    if (that.sc.suggestionHeight)
                        if (!next) that.sc.scrollTop(0);
                        else {
                            var scrTop = that.sc.scrollTop(), selTop = next.offset().top - that.sc.offset().top;
                            if ((selTop + that.sc.suggestionHeight) - that.sc.maxHeight > 0)
                                that.sc.scrollTop((selTop + that.sc.suggestionHeight + scrTop) - that.sc.maxHeight);
                            else if (selTop < 0)
                                that.sc.scrollTop(selTop + scrTop);
                        }
                }
            }
            $(window).on('resize.autocomplete', that.updateSC);

            that.sc.appendTo('body');

            that.sc.on('mouseleave.autocomplete', '.autocomplete-suggestion', function (){
                $('.autocomplete-suggestion.selected').removeClass('selected');
            });

            that.sc.on('mouseenter.autocomplete', '.autocomplete-suggestion', function (){
                $('.autocomplete-suggestion.selected').removeClass('selected');
                $(this).addClass('selected');
            });

            that.sc.on('mousedown.autocomplete', '.autocomplete-suggestion', function (e){
                var item = $(this), v = item.data('val');
                that.val(v);
                o.onSelect(e, v, item);
                setTimeout(function(){ that.focus().sc.hide(); }, 10);
            });

            that.blur(function(){
                try { over_sb = $('.autocomplete-suggestions:hover').length; } catch(e){ over_sb = 0; } // ***
                if (!over_sb) {
                    that.last_val = that.val();
                    that.sc.hide();
                }
            });

            // IE hack ***: input looses focus when clicking scrollbars in suggestions container
            that.sc.focus(function(){
                that.focus();
            });

            function suggest(data){
                var val = that.val();
                that.cache[val] = data;
                if (data.length && val.length >= o.minChars) {
                    var s = '<div class="mega_suggestions" style="float:left;width:200px;">';
                    for (i=0;i<data.length;i++) s += o.renderItem(data[i], val);
                    s += '</div>';
                    s += renderProducts();
                    s += renderCats();
                    that.sc.html(s);
                    that.updateSC(0);
                }
                else
                    that.sc.hide();
            }

            function renderProducts() {
                var output = '<div class="products" style="float:left;width:275px;background:#f0f0f0;height:400px">';
                output += '<h4>Top results for keyword</h4>';
                for (i=0;i<9;i++) {
                    output += '<div class="product_box" style="margin:5px;float:left;height:75px;width:75px;background-color:#FFFFFF;"></div>';
                }
                output += '</div>';
                return output;
            }

            function renderCats() {
                var output = '<div class="cats" style="float:left;width:200px;height:400px">';
                output += '<h4>Brands</h4>';
                output += '<ul>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '</ul>';
                output += '<h4>Cats</h4>';
                output += '<ul>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '<li>Test</li>';
                output += '</ul>';
                output += '</div>';
                return output;
            }

            that.on('keydown.autocomplete', function(e){
                // down
                if (e.which == 40 && that.sc.html()) {
                    var next, sel = $('.autocomplete-suggestion.selected', that.sc);
                    if (!sel.length) {
                        next = $('.autocomplete-suggestion', that.sc).first();
                        that.val(next.addClass('selected').data('val'));
                    } else {
                        next = sel.next('.autocomplete-suggestion');
                        if (next.length) {
                            sel.removeClass('selected');
                            that.val(next.addClass('selected').data('val'));
                        }
                        else { sel.removeClass('selected'); that.val(that.last_val); next = 0; }
                    }
                    that.updateSC(0, next);
                    return false;
                }
                // up
                else if (e.which == 38 && that.sc.html()) {
                    var next, sel = $('.autocomplete-suggestion.selected', that.sc);
                    if (!sel.length) {
                        next = $('.autocomplete-suggestion', that.sc).last();
                        that.val(next.addClass('selected').data('val'));
                    } else {
                        var next = sel.prev('.autocomplete-suggestion');
                        if (next.length) {
                            sel.removeClass('selected');
                            that.val(next.addClass('selected').data('val'));
                        }
                        else { sel.removeClass('selected'); that.val(that.last_val); next = 0; }
                    }
                    that.updateSC(0, next);
                    return false;
                }
                // esc
                else if (e.which == 27) that.val(that.last_val).sc.hide();
                // enter
                else if (e.which == 13) {
                    var sel = $('.autocomplete-suggestion.selected', that.sc);
                    if (sel.length) { o.onSelect(e, sel.data('val'), sel); setTimeout(function(){ that.focus().sc.hide(); }, 10); }
                }
            });

            that.on('keyup.autocomplete', function(e){
                if (!~$.inArray(e.which, [27, 38, 40, 37, 39])) {
                    var val = that.val();
                    if (val.length >= o.minChars) {
                        if (val != that.last_val) {
                            that.last_val = val;
                            clearTimeout(that.timer);
                            if (o.cache) {
                                if (val in that.cache) { suggest(that.cache[val]); return; }
                                // no requests if previous suggestions were empty
                                for (i=1; i<val.length-o.minChars; i++) {
                                    var part = val.slice(0, val.length-i);
                                    if (part in that.cache && !that.cache[part].length) { suggest([]); return; }
                                }
                            }
                            that.timer = setTimeout(function(){ o.source(val, suggest) }, o.delay);
                        }
                    } else {
                        that.last_val = val;
                        that.sc.hide();
                    }
                }
            });
        });
    }

    $.fn.autoComplete.defaults = {
        source: 0,
        minChars: 3,
        delay: 100,
        cache: 1,
        menuClass: '',
        renderItem: function (item, search){
            var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
            return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
        },
        onSelect: function(e, term, item){}
    };
}(jQuery));
