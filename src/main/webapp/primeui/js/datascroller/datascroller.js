/**
 * PrimeUI Datascroller Widget
 */
(function() {

    $.widget("primeui.puidatascroller", {
       
        options: {
            header: null,
            buffer: 0.9,
            chunkSize: 10,
            datasource: null,
            lazy: false,
            content: null,
            template: null,
            mode: 'document',
            loader: null,
            scrollHeight: null
        },
        
        _create: function() {
            this.id = this.element.attr('id');
            if(!this.id) {
                this.id = this.element.uniqueId().attr('id');
            }
            
            this.element.addClass('pui-datascroller ui-widget');
            if(this.options.header) {
                this.header = this.element.append('<div class="pui-datascroller-header ui-widget-header ui-corner-top">' + this.options.header + '</div>').children('.pui-datascroller-header');
            }
            

            
            this.content = this.element.append('<div class="pui-datascroller-content ui-widget-content ui-corner-bottom"></div>').children('.pui-datascroller-content');
            this.list = this.content.append('<ul class="pui-datascroller-list"></ul>').children('.pui-datascroller-list');
            this.loaderContainer = this.content.append('<div class="pui-datascroller-loader"></div>').children('.pui-datascroller-loader');
            this.loadStatus = $('<div class="pui-datascroller-loading"></div>');
            this.loading = false;
            this.allLoaded = false;
            this.offset = 0;
            
            if(this.options.mode === 'self') {
                this.element.addClass('pui-datascroller-inline');
                
                if(this.options.scrollHeight) {
                    this.content.css('height', this.options.scrollHeight);
                }
            }
            
            if(this.options.loader) {
                this.loadTrigger = this.loaderContainer.children();
                this.bindManualLoader();
            }
            else {
                this.bindScrollListener();
            }

            if(this.options.datasource) {
                if($.isArray(this.options.datasource)) {
                    this._onDataInit(this.options.datasource);
                }
                else if($.type(this.options.datasource) === 'function') {
                    if(this.options.lazy)
                        this.options.datasource.call(this, this._onLazyLoad, {first:this.offset});
                    else
                        this.options.datasource.call(this, this._onDataInit);
                }
            }
        },
        
        _onDataInit: function(data) {
            this.data = data||[];
            this.options.totalSize = this.data.length;
            
            this._load();
        },
        
        _onLazyLoad: function(data) {
            this._renderData(data, 0, this.options.chunkSize);
            
            this._onloadComplete();
        },
        
        bindScrollListener: function() {
            var $this = this;

            if(this.options.mode === 'document') {
                var win = $(window),
                doc = $(document),
                $this = this,
                NS = 'scroll.' + this.id;

                win.off(NS).on(NS, function () {
                    if(win.scrollTop() >= ((doc.height() * $this.options.buffer) - win.height()) && $this.shouldLoad()) {
                        $this._load();
                    }
                });
            }
            else {
                this.content.on('scroll', function () {
                    var scrollTop = this.scrollTop,
                    scrollHeight = this.scrollHeight,
                    viewportHeight = this.clientHeight;

                    if((scrollTop >= ((scrollHeight * $this.options.buffer) - (viewportHeight))) && $this.shouldLoad()) {
                        $this._load();
                    }
                });
            }
        },

        bindManualLoader: function() {
            var $this = this;

            this.loadTrigger.on('click.dataScroller', function(e) {
                $this.load();
                e.preventDefault();
            });
        },

        _load: function() {
            this.loading = true;
            this.loadStatus.appendTo(this.loaderContainer);
            if(this.loader) {
                this.loader.hide();
            }

            if(this.options.lazy) {
                this.options.datasource.call(this, this._onLazyLoad, {first: this.offset});
            }
            else {
               this._renderData(this.data, this.offset, (this.offset + this.options.chunkSize));
               this._onloadComplete();
            }
        },
        
        _renderData: function(data, start, end) {
            if(data && data.length) {
                for(var i = start; i < end; i++) {
                    var listItem = $('<li class="pui-datascroller-item"></li>'),
                    content = this._createItemContent(data[i]);
                    listItem.append(content);
                    
                    this.list.append(listItem); 
                }
            }
        },
        
        shouldLoad: function() {
            return (!this.loading && !this.allLoaded);
        },
        
        _createItemContent: function(obj) {
            if(this.options.template) {
                var template = this.options.template.html();
                Mustache.parse(template);
                return Mustache.render(template, obj);
            }
            else {
                return this.options.content.call(this, obj);
            }
        },
        
        _onloadComplete: function() {
            this.offset += this.options.chunkSize;
            this.loading = false;
            this.allLoaded = this.offset >= this.options.totalSize;

            this.loadStatus.remove();

            if(this.loader && !this.allLoaded) {
                this.loader.show();
            }
        }
        
    });
    
})();