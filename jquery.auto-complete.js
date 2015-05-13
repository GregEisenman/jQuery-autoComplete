/*
	jQuery autoComplete v1.0.6
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/jQuery-autoComplete
	License: http://www.opensource.org/licenses/mit-license.php
*/

/*
 http://xpresswebsolutionz.com/search_box/2/
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
            };

            $(window).on('resize.autocomplete', that.updateSC);

            that.sc.appendTo('body');

            that.sc.on('mouseleave.autocomplete', '.autocomplete-suggestion', function (){
                $('.autocomplete-suggestion.selected').removeClass('selected');
            });

            that.sc.on('mouseenter.autocomplete', '.autocomplete-suggestion', function (){
                $('.autocomplete-suggestion.selected').removeClass('selected');
                $(this).addClass('selected');
                var item = $(this), v = item.data('val');
                console.log("This: "+v);
                getSecondaryData(v);
            });

            that.sc.on('mousedown.autocomplete', '.autocomplete-suggestion', function (e){
                var item = $(this), v = item.data('val');
                that.val(v);
                o.onSelect(e, v, item);
                setTimeout(function(){ that.focus().sc.hide(); }, 10);
            });

            // IE hack ***: input looses focus when clicking scrollbars in suggestions container
            that.blur(function(){
                try { over_sb = $('.autocomplete-suggestions:hover').length; } catch(e){ over_sb = 0; } // ***
                if (!over_sb) {
                    that.last_val = that.val();
                    that.sc.hide();
                }
            });

            that.sc.focus(function(){
                that.focus();
            });

            function getSecondaryData(val) {
                var products = [];
                var brands = [];
                var used_for = [];
                $.ajax({
                    url: "http://ss.staging.cloud-results.com/suggest",
                    //url: "http://ss.dev/suggest",
                    jsonp: "callback",
                    dataType: "jsonp",
                    data: {
                        q: val
                    },
                    success: function( response ) {
                        //console.log(response);
                        jQuery.each(response, function(index, item) {
                            //console.log(item);
                            if (item.type == "product") {
                                products.push(item);
                            } else if (item.type == "brand") {
                                brands.push(item);
                            } else if (item.type == "used_for") {
                                used_for.push(item);
                            }
                        });
                        refreshSecondaryData(val, products, brands, used_for);
                    }
                });
            }

            function refreshSecondaryData(val, products, brands, used_for) {
                $('.autocomplete-suggestions div.products_container').fadeOut('fast', function () {
                    $(this).html(renderProducts(products, val)).fadeIn('fast');
                });
                $('.autocomplete-suggestions div.cats_container').fadeOut('fast', function () {
                    $(this).html(renderCats(brands, used_for)).fadeIn('fast');
                });
                var cats_height = document.getElementById('mega_suggestions').scrollHeight;
                document.getElementById("cats_container").setAttribute("style","height:"+cats_height+"px;");
                //$('.autocomplete-suggestions div.products').html(renderProducts(products));
                //$('.autocomplete-suggestions div.cats').html(renderCats(brands));
            }

            function suggest(suggestions, products, brands, used_for) {
                var val = that.val();
                that.cache[val] = suggestions; //hmmm, will this populate all fields (brands, products) EDIT: nope!
                if (suggestions.length && val.length >= o.minChars) {
                    s = renderSuggestions(suggestions, val);
                    if (products) s += renderProducts(products, val);
                    if (brands || used_for) s += renderCats(brands, used_for);
                    that.sc.html(s);
                    that.updateSC(0);
                    var cats_height = document.getElementById('mega_suggestions').scrollHeight;
                    document.getElementById("cats_container").setAttribute("style","height:"+cats_height+"px;");

                }
                else
                    that.sc.hide();
            }

            function renderSuggestions(suggestions, val) {
                //console.log(val);
                var output = '<div id="mega_suggestions" style="float:left;width:200px;">';
                for (i=0;i<suggestions.length;i++) {
                    output += o.renderItem(suggestions[i], val);
                }
                output += '</div>';
                return output;
            }

            function renderProducts(products, val) {
                //console.log(products[0]);
                var output = '<div class="products">';
                output += '<div class="products_container">';
                output += '<h3>Top Results for "'+val+'"</h3>';
                for (i=0;i<products.length;i++) {
                    output += '<div class="product_box">';
                    output += '<a href="'+products[i].url+'"><img src="'+products[i].image+'" height="120" width="120" border="0" /></a>';
                    output += '<div class="title"><a href="'+products[i].url+'"><h4>'+products[i].title+'</h4></a></div>';
                    output += '<div class="price">$'+parseFloat(products[i].price).toFixed(2)+'</div>';
                    output += '</div>';
                }
                output += '</div>';
                output += '</div>';
                return output;
            }

            function renderCats(brands, used_for) {
                //console.log(brands[0]);
                var output = '<div id="cats" style="float:left;width:200px;">';
                output += '<div id="cats_container">';

                output += '<h3>Brands</h3>';
                output += '<div class="input-group">';
                for (i=0;i<brands.length;i++) {
                    output += '<div class="checkbox"><label>';
                    output += '<input type="checkbox">'+brands[i].value;
                    output += '</label></div>';
                }
                output += '</div>';

                output += '<h3>Used For</h3>';
                output += '<div class="input-group">';
                for (i=0;i<used_for.length;i++) {
                    output += '<div class="checkbox"><label>';
                    output += '<input type="checkbox">'+used_for[i].value;
                    output += '</label></div>';
                }
                output += '</div>';

                output += '</div>';
                output += '</div>';
                return output;
            }

            that.on('keydown.autocomplete', function(e){
                // down
                if (e.which == 40 && that.sc.html()) {
                    console.log('down');
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
                    getSecondaryData(next.data('val'));
                    that.updateSC(0, next);
                    return false;
                }
                // up
                else if (e.which == 38 && that.sc.html()) {
                    console.log('up');
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
                    getSecondaryData(next.data('val'));
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
    };

    $.fn.autoComplete.defaults = {
        source: 0,
        minChars: 2,
        delay: 70,
        cache: 0,
        menuClass: '',
        renderItem: function (item, search){
            var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
            return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
        },
        onSelect: function(e, term, item){}
    };
}(jQuery));
