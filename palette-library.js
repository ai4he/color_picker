/**
 * Palette Library - Multiple Palette Storage & Management
 * 
 * Allows users to save, load, browse, and manage multiple color palettes
 * 
 * Created by:Austin LaHue &  Frederick Gyasi
 */

'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        root.PaletteLibrary = factory(root.jQuery);
    }
}(typeof self !== 'undefined' ? self : this, function ($) {

    function PaletteLibrary(options) {
        this.options = $.extend({
            storageKey: 'colorPicker_paletteLibrary',
            maxPalettes: 50,
            autoSave: true
        }, options);
        
        this.palettes = this.loadPalettes();
    }

    // ============================================
    // STORAGE MANAGEMENT
    // ============================================

    PaletteLibrary.prototype.loadPalettes = function() {
        try {
            var data = localStorage.getItem(this.options.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load palette library:', e);
            return [];
        }
    };

    PaletteLibrary.prototype.savePalettes = function() {
        try {
            localStorage.setItem(this.options.storageKey, JSON.stringify(this.palettes));
            return true;
        } catch (e) {
            console.error('Failed to save palette library:', e);
            return false;
        }
    };

    // ============================================
    // PALETTE OPERATIONS
    // ============================================

    PaletteLibrary.prototype.savePalette = function(paletteData) {
        var palette = {
            id: this.generatePaletteId(),
            name: paletteData.name || 'Untitled Palette',
            description: paletteData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            colors: paletteData.colors || [],
            tags: paletteData.tags || [],
            metadata: {
                source: paletteData.source || 'user',
                sessionComparisons: paletteData.sessionComparisons || 0,
                sessionDuration: paletteData.sessionDuration || 0,
                colorCount: (paletteData.colors || []).length
            },
            isFavorite: false
        };

        this.palettes.unshift(palette);
        
        // Keep only most recent palettes
        if (this.palettes.length > this.options.maxPalettes) {
            this.palettes = this.palettes.slice(0, this.options.maxPalettes);
        }
        
        if (this.options.autoSave) {
            this.savePalettes();
        }
        
        return palette;
    };

    PaletteLibrary.prototype.updatePalette = function(paletteId, updates) {
        var palette = this.getPalette(paletteId);
        if (!palette) return null;
        
        // Update fields
        if (updates.name) palette.name = updates.name;
        if (updates.description !== undefined) palette.description = updates.description;
        if (updates.colors) palette.colors = updates.colors;
        if (updates.tags) palette.tags = updates.tags;
        if (updates.isFavorite !== undefined) palette.isFavorite = updates.isFavorite;
        
        palette.updatedAt = new Date().toISOString();
        
        if (this.options.autoSave) {
            this.savePalettes();
        }
        
        return palette;
    };

    PaletteLibrary.prototype.deletePalette = function(paletteId) {
        var index = this.palettes.findIndex(p => p.id === paletteId);
        if (index === -1) return false;
        
        this.palettes.splice(index, 1);
        
        if (this.options.autoSave) {
            this.savePalettes();
        }
        
        return true;
    };

    PaletteLibrary.prototype.duplicatePalette = function(paletteId) {
        var original = this.getPalette(paletteId);
        if (!original) return null;
        
        var duplicate = {
            id: this.generatePaletteId(),
            name: original.name + ' (Copy)',
            description: original.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            colors: JSON.parse(JSON.stringify(original.colors)),
            tags: [...original.tags],
            metadata: JSON.parse(JSON.stringify(original.metadata)),
            isFavorite: false
        };
        
        this.palettes.unshift(duplicate);
        
        if (this.options.autoSave) {
            this.savePalettes();
        }
        
        return duplicate;
    };

    // ============================================
    // RETRIEVAL OPERATIONS
    // ============================================

    PaletteLibrary.prototype.getPalette = function(paletteId) {
        return this.palettes.find(p => p.id === paletteId);
    };

    PaletteLibrary.prototype.getAllPalettes = function() {
        return this.palettes;
    };

    PaletteLibrary.prototype.getFavoritePalettes = function() {
        return this.palettes.filter(p => p.isFavorite);
    };

    PaletteLibrary.prototype.getRecentPalettes = function(count) {
        count = count || 5;
        return this.palettes.slice(0, count);
    };

    PaletteLibrary.prototype.searchPalettes = function(query) {
        query = query.toLowerCase();
        
        return this.palettes.filter(p => {
            return p.name.toLowerCase().includes(query) ||
                   p.description.toLowerCase().includes(query) ||
                   p.tags.some(tag => tag.toLowerCase().includes(query));
        });
    };

    PaletteLibrary.prototype.filterByTag = function(tag) {
        return this.palettes.filter(p => p.tags.includes(tag));
    };

    PaletteLibrary.prototype.getAllTags = function() {
        var tags = new Set();
        this.palettes.forEach(p => {
            p.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    };

    // ============================================
    // PALETTE ORGANIZATION
    // ============================================

    PaletteLibrary.prototype.toggleFavorite = function(paletteId) {
        var palette = this.getPalette(paletteId);
        if (!palette) return false;
        
        palette.isFavorite = !palette.isFavorite;
        palette.updatedAt = new Date().toISOString();
        
        if (this.options.autoSave) {
            this.savePalettes();
        }
        
        return palette.isFavorite;
    };

    PaletteLibrary.prototype.addTag = function(paletteId, tag) {
        var palette = this.getPalette(paletteId);
        if (!palette) return false;
        
        if (!palette.tags.includes(tag)) {
            palette.tags.push(tag);
            palette.updatedAt = new Date().toISOString();
            
            if (this.options.autoSave) {
                this.savePalettes();
            }
        }
        
        return true;
    };

    PaletteLibrary.prototype.removeTag = function(paletteId, tag) {
        var palette = this.getPalette(paletteId);
        if (!palette) return false;
        
        var index = palette.tags.indexOf(tag);
        if (index > -1) {
            palette.tags.splice(index, 1);
            palette.updatedAt = new Date().toISOString();
            
            if (this.options.autoSave) {
                this.savePalettes();
            }
        }
        
        return true;
    };

    PaletteLibrary.prototype.sortPalettes = function(sortBy) {
        switch(sortBy) {
            case 'name':
                this.palettes.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'date-new':
                this.palettes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'date-old':
                this.palettes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'colors':
                this.palettes.sort((a, b) => b.metadata.colorCount - a.metadata.colorCount);
                break;
            case 'favorite':
                this.palettes.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
                break;
        }
        
        if (this.options.autoSave) {
            this.savePalettes();
        }
    };

    // ============================================
    // EXPORT / IMPORT
    // ============================================

    PaletteLibrary.prototype.exportPalette = function(paletteId, format) {
        var palette = this.getPalette(paletteId);
        if (!palette) return null;
        
        switch(format) {
            case 'json':
                return JSON.stringify(palette, null, 2);
            case 'css':
                return this.paletteToCSS(palette);
            case 'hex':
                return this.paletteToHexList(palette);
            case 'scss':
                return this.paletteToSCSS(palette);
            default:
                return palette;
        }
    };

    PaletteLibrary.prototype.exportLibrary = function() {
        return JSON.stringify({
            version: '1.0',
            exportedAt: new Date().toISOString(),
            paletteCount: this.palettes.length,
            palettes: this.palettes
        }, null, 2);
    };

    PaletteLibrary.prototype.importLibrary = function(jsonData) {
        try {
            var data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.palettes || !Array.isArray(data.palettes)) {
                return { success: false, error: 'Invalid library format' };
            }
            
            var imported = 0;
            data.palettes.forEach(palette => {
                // Regenerate IDs to avoid conflicts
                palette.id = this.generatePaletteId();
                palette.createdAt = new Date().toISOString();
                this.palettes.unshift(palette);
                imported++;
            });
            
            // Keep within limit
            if (this.palettes.length > this.options.maxPalettes) {
                this.palettes = this.palettes.slice(0, this.options.maxPalettes);
            }
            
            if (this.options.autoSave) {
                this.savePalettes();
            }
            
            return { success: true, imported: imported };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    // ============================================
    // FORMAT CONVERSIONS
    // ============================================

    PaletteLibrary.prototype.paletteToCSS = function(palette) {
        var css = '/* ' + palette.name + ' */\n';
        if (palette.description) {
            css += '/* ' + palette.description + ' */\n';
        }
        css += '/* Created: ' + new Date(palette.createdAt).toLocaleDateString() + ' */\n\n';
        css += ':root {\n';
        
        palette.colors.forEach((color, i) => {
            var varName = this.colorToVariableName(color.name || color.hex);
            css += '  --' + varName + ': ' + color.hex + ';';
            if (color.name && color.name !== color.hex) {
                css += ' /* ' + color.name + ' */';
            }
            css += '\n';
        });
        
        css += '}\n';
        return css;
    };

    PaletteLibrary.prototype.paletteToSCSS = function(palette) {
        var scss = '// ' + palette.name + '\n';
        if (palette.description) {
            scss += '// ' + palette.description + '\n';
        }
        scss += '// Created: ' + new Date(palette.createdAt).toLocaleDateString() + '\n\n';
        
        palette.colors.forEach((color, i) => {
            var varName = this.colorToVariableName(color.name || color.hex);
            scss += '$' + varName + ': ' + color.hex + ';';
            if (color.name && color.name !== color.hex) {
                scss += ' // ' + color.name;
            }
            scss += '\n';
        });
        
        return scss;
    };

    PaletteLibrary.prototype.paletteToHexList = function(palette) {
        var text = palette.name + '\n';
        text += '='.repeat(palette.name.length) + '\n\n';
        if (palette.description) {
            text += palette.description + '\n\n';
        }
        
        palette.colors.forEach((color, i) => {
            text += (i + 1) + '. ' + color.hex;
            if (color.name && color.name !== color.hex) {
                text += ' (' + color.name + ')';
            }
            if (color.rating) {
                text += ' - Rating: ' + Math.round(color.rating);
            }
            text += '\n';
        });
        
        return text;
    };

    PaletteLibrary.prototype.colorToVariableName = function(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .replace(/^[0-9]/, 'color-$&');
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    PaletteLibrary.prototype.generatePaletteId = function() {
        return 'palette_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    PaletteLibrary.prototype.getStatistics = function() {
        return {
            totalPalettes: this.palettes.length,
            favoritePalettes: this.palettes.filter(p => p.isFavorite).length,
            totalColors: this.palettes.reduce((sum, p) => sum + p.metadata.colorCount, 0),
            averageColorsPerPalette: this.palettes.length > 0 ? 
                Math.round(this.palettes.reduce((sum, p) => sum + p.metadata.colorCount, 0) / this.palettes.length) : 0,
            allTags: this.getAllTags(),
            oldestPalette: this.palettes.length > 0 ? 
                new Date(Math.min(...this.palettes.map(p => new Date(p.createdAt)))).toLocaleDateString() : null,
            newestPalette: this.palettes.length > 0 ? 
                new Date(Math.max(...this.palettes.map(p => new Date(p.createdAt)))).toLocaleDateString() : null
        };
    };

    PaletteLibrary.prototype.clearLibrary = function() {
        if (confirm('Are you sure you want to delete ALL palettes? This cannot be undone.')) {
            this.palettes = [];
            this.savePalettes();
            return true;
        }
        return false;
    };

    return PaletteLibrary;
}));
