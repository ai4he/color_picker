/**
 * Enhanced Tooltip System
 * 
 * Rich contextual tooltips with accessibility support
 * Created by: Frederick Gyasi
 */

'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        root.TooltipManager = factory(root.jQuery);
    }
}(typeof self !== 'undefined' ? self : this, function ($) {

    function TooltipManager(options) {
        this.options = $.extend({
            delay: 300,
            duration: 200,
            className: 'rich-tooltip',
            position: 'top'
        }, options);
        
        this.currentTooltip = null;
        this.showTimeout = null;
        
        this.init();
    }

    TooltipManager.prototype.init = function() {
        var self = this;
        
        // Create tooltip container if it doesn't exist
        if ($('#tooltip-container').length === 0) {
            $('<div id="tooltip-container"></div>').appendTo('body');
        }
        
        // Handle mouse events
        $(document).on('mouseenter', '[data-tooltip]', function(e) {
            self.show(this, e);
        });
        
        $(document).on('mouseleave', '[data-tooltip]', function(e) {
            self.hide();
        });
        
        // Handle focus events for keyboard accessibility
        $(document).on('focus', '[data-tooltip]', function(e) {
            self.show(this, e);
        });
        
        $(document).on('blur', '[data-tooltip]', function(e) {
            self.hide();
        });
        
        // Update position on mouse move for better UX
        $(document).on('mousemove', '[data-tooltip]', function(e) {
            if (self.currentTooltip) {
                self.updatePosition(e);
            }
        });
    };

    TooltipManager.prototype.show = function(element, event) {
        var self = this;
        
        // Clear any existing timeout
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }
        
        // Delay showing tooltip
        this.showTimeout = setTimeout(function() {
            var $element = $(element);
            var tooltipData = $element.data('tooltip');
            
            if (!tooltipData) return;
            
            // Parse tooltip data (can be string or object)
            var content;
            if (typeof tooltipData === 'string') {
                content = tooltipData;
            } else {
                content = self.formatTooltipContent(tooltipData);
            }
            
            // Create tooltip element
            var $tooltip = $('<div></div>')
                .addClass(self.options.className)
                .html(content)
                .attr('role', 'tooltip')
                .attr('aria-live', 'polite');
            
            // Remove any existing tooltip
            self.hide();
            
            // Add to container
            $('#tooltip-container').append($tooltip);
            self.currentTooltip = $tooltip;
            
            // Position tooltip
            self.positionTooltip($tooltip, $element, event);
            
            // Fade in
            setTimeout(function() {
                $tooltip.addClass('show');
            }, 10);
        }, this.options.delay);
    };

    TooltipManager.prototype.hide = function() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        
        if (this.currentTooltip) {
            var $tooltip = this.currentTooltip;
            $tooltip.removeClass('show');
            
            setTimeout(function() {
                $tooltip.remove();
            }, this.options.duration);
            
            this.currentTooltip = null;
        }
    };

    TooltipManager.prototype.formatTooltipContent = function(data) {
        var html = '<div class="tooltip-content">';
        
        if (data.title) {
            html += '<div class="tooltip-title">' + data.title + '</div>';
        }
        
        if (data.hex) {
            html += '<div class="tooltip-hex"><strong>Hex:</strong> ' + data.hex + '</div>';
        }
        
        if (data.rgb) {
            html += '<div class="tooltip-rgb"><strong>RGB:</strong> ' + 
                    data.rgb.r + ', ' + data.rgb.g + ', ' + data.rgb.b + '</div>';
        }
        
        if (data.hsl) {
            html += '<div class="tooltip-hsl"><strong>HSL:</strong> ' + 
                    data.hsl.h + '°, ' + data.hsl.s + '%, ' + data.hsl.l + '%</div>';
        }
        
        if (data.rating !== undefined) {
            html += '<div class="tooltip-rating"><strong>Rating:</strong> ' + 
                    Math.round(data.rating) + '</div>';
        }
        
        if (data.comparisons !== undefined) {
            html += '<div class="tooltip-comparisons"><strong>Comparisons:</strong> ' + 
                    data.comparisons + '</div>';
        }
        
        if (data.winRate !== undefined) {
            html += '<div class="tooltip-winrate"><strong>Win Rate:</strong> ' + 
                    data.winRate + '%</div>';
        }
        
        if (data.description) {
            html += '<div class="tooltip-description">' + data.description + '</div>';
        }
        
        if (data.action) {
            html += '<div class="tooltip-action">' + data.action + '</div>';
        }
        
        html += '</div>';
        return html;
    };

    TooltipManager.prototype.positionTooltip = function($tooltip, $element, event) {
        var elementRect = $element[0].getBoundingClientRect();
        var tooltipWidth = $tooltip.outerWidth();
        var tooltipHeight = $tooltip.outerHeight();
        var position = this.options.position;
        
        var top, left;
        
        switch(position) {
            case 'top':
                top = elementRect.top - tooltipHeight - 10;
                left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
                break;
            case 'bottom':
                top = elementRect.bottom + 10;
                left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
                break;
            case 'left':
                top = elementRect.top + (elementRect.height / 2) - (tooltipHeight / 2);
                left = elementRect.left - tooltipWidth - 10;
                break;
            case 'right':
                top = elementRect.top + (elementRect.height / 2) - (tooltipHeight / 2);
                left = elementRect.right + 10;
                break;
            default:
                top = elementRect.top - tooltipHeight - 10;
                left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        }
        
        // Keep tooltip within viewport
        var viewportWidth = $(window).width();
        var viewportHeight = $(window).height();
        
        if (left < 10) left = 10;
        if (left + tooltipWidth > viewportWidth - 10) {
            left = viewportWidth - tooltipWidth - 10;
        }
        
        if (top < 10) {
            // If would go off top, show below instead
            top = elementRect.bottom + 10;
        }
        if (top + tooltipHeight > viewportHeight - 10) {
            top = viewportHeight - tooltipHeight - 10;
        }
        
        $tooltip.css({
            top: top + 'px',
            left: left + 'px'
        });
    };

    TooltipManager.prototype.updatePosition = function(event) {
        // Optional: Update tooltip position based on mouse movement
        // This can make tooltips feel more responsive
    };

    TooltipManager.prototype.destroy = function() {
        $(document).off('mouseenter mouseleave focus blur', '[data-tooltip]');
        $('#tooltip-container').remove();
        this.hide();
    };

    return TooltipManager;
}));
