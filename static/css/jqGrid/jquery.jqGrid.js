(function($) {
    $.jgrid = $.jgrid || {};
    $.extend($.jgrid, {
        version: "4.7.1",
        htmlDecode: function(value) {
            if (value && (value === "&nbsp;" || value === "&#160;" || (value.length === 1 && value.charCodeAt(0) === 160))) {
                return ""
            }
            return ! value ? value: String(value).replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
        },
        htmlEncode: function(value) {
            return ! value ? value: String(value).replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        },
        format: function(format) {
            var args = $.makeArray(arguments).slice(1);
            if (format == null) {
                format = ""
            }
            return format.replace(/\{(\d+)\}/g,
            function(m, i) {
                return args[i]
            })
        },
        msie: navigator.appName === "Microsoft Internet Explorer",
        msiever: function() {
            var rv = -1;
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
            if (re.exec(ua) != null) {
                rv = parseFloat(RegExp.$1)
            }
            return rv
        },
        msie11: (navigator.userAgent.match(/Trident/) && navigator.userAgent.match(/rv:11/)),
        getCellIndex: function(cell) {
            var c = $(cell);
            if (c.is("tr")) {
                return - 1
            }
            c = (!c.is("td") && !c.is("th") ? c.closest("td,th") : c)[0];
            if ($.jgrid.msie) {
                return $.inArray(c, c.parentNode.cells)
            }
            return c.cellIndex
        },
        stripHtml: function(v) {
            v = String(v);
            var regexp = /<("[^"]*"|'[^']*'|[^'">])*>/gi;
            if (v) {
                v = v.replace(regexp, "");
                return (v && v !== "&nbsp;" && v !== "&#160;") ? v.replace(/\"/g, "'") : ""
            }
            return v
        },
        stripPref: function(pref, id) {
            var obj = $.type(pref);
            if (obj === "string" || obj === "number") {
                pref = String(pref);
                id = pref !== "" ? String(id).replace(String(pref), "") : id
            }
            return id
        },
        parse: function(jsonString) {
            var js = jsonString;
            if (js.substr(0, 9) === "while(1);") {
                js = js.substr(9)
            }
            if (js.substr(0, 2) === "/*") {
                js = js.substr(2, js.length - 4)
            }
            if (!js) {
                js = "{}"
            }
            return ($.jgrid.useJSON === true && typeof JSON === "object" && typeof JSON.parse === "function") ? JSON.parse(js) : eval("(" + js + ")")
        },
        parseDate: function(format, date, newformat, opts) {
            var token = /\\.|[dDjlNSwzWFmMntLoYyaABgGhHisueIOPTZcrU]/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            msDateRegExp = new RegExp("^/Date\\((([-+])?[0-9]+)(([-+])([0-9]{2})([0-9]{2}))?\\)/$"),
            msMatch = ((typeof date === "string") ? date.match(msDateRegExp) : null),
            pad = function(value, length) {
                value = String(value);
                length = parseInt(length, 10) || 2;
                while (value.length < length) {
                    value = "0" + value
                }
                return value
            },
            ts = {
                m: 1,
                d: 1,
                y: 1970,
                h: 0,
                i: 0,
                s: 0,
                u: 0
            },
            timestamp = 0,
            dM,
            k,
            hl,
            h12to24 = function(ampm, h) {
                if (ampm === 0) {
                    if (h === 12) {
                        h = 0
                    }
                } else {
                    if (h !== 12) {
                        h += 12
                    }
                }
                return h
            },
            offset = 0;
            if (opts === undefined) {
                opts = $.jgrid.formatter.date
            }
            if (opts.parseRe === undefined) {
                opts.parseRe = /[#%\\\/:_;.,\t\s-]/
            }
            if (opts.masks.hasOwnProperty(format)) {
                format = opts.masks[format]
            }
            if (date && date != null) {
                if (!isNaN(date - 0) && String(format).toLowerCase() === "u") {
                    timestamp = new Date(parseFloat(date))
                } else {
                    if (date.constructor === Date) {
                        timestamp = date
                    } else {
                        if (msMatch !== null) {
                            timestamp = new Date(parseInt(msMatch[1], 10));
                            if (msMatch[3]) {
                                offset = Number(msMatch[5]) * 60 + Number(msMatch[6]);
                                offset *= ((msMatch[4] === "-") ? 1 : -1);
                                offset -= timestamp.getTimezoneOffset();
                                timestamp.setTime(Number(Number(timestamp) + (offset * 60 * 1000)))
                            }
                        } else {
                            if (opts.srcformat === "ISO8601Long" && date.charAt(date.length - 1) === "Z") {
                                offset -= (new Date()).getTimezoneOffset()
                            }
                            date = String(date).replace(/\T/g, "#").replace(/\t/, "%").split(opts.parseRe);
                            format = format.replace(/\T/g, "#").replace(/\t/, "%").split(opts.parseRe);
                            for (k = 0, hl = format.length; k < hl; k++) {
                                if (format[k] === "M") {
                                    dM = $.inArray(date[k], opts.monthNames);
                                    if (dM !== -1 && dM < 12) {
                                        date[k] = dM + 1;
                                        ts.m = date[k]
                                    }
                                }
                                if (format[k] === "F") {
                                    dM = $.inArray(date[k], opts.monthNames, 12);
                                    if (dM !== -1 && dM > 11) {
                                        date[k] = dM + 1 - 12;
                                        ts.m = date[k]
                                    }
                                }
                                if (format[k] === "a") {
                                    dM = $.inArray(date[k], opts.AmPm);
                                    if (dM !== -1 && dM < 2 && date[k] === opts.AmPm[dM]) {
                                        date[k] = dM;
                                        ts.h = h12to24(date[k], ts.h)
                                    }
                                }
                                if (format[k] === "A") {
                                    dM = $.inArray(date[k], opts.AmPm);
                                    if (dM !== -1 && dM > 1 && date[k] === opts.AmPm[dM]) {
                                        date[k] = dM - 2;
                                        ts.h = h12to24(date[k], ts.h)
                                    }
                                }
                                if (format[k] === "g") {
                                    ts.h = parseInt(date[k], 10)
                                }
                                if (date[k] !== undefined) {
                                    ts[format[k].toLowerCase()] = parseInt(date[k], 10)
                                }
                            }
                            if (ts.f) {
                                ts.m = ts.f
                            }
                            if (ts.m === 0 && ts.y === 0 && ts.d === 0) {
                                return "&#160;"
                            }
                            ts.m = parseInt(ts.m, 10) - 1;
                            var ty = ts.y;
                            if (ty >= 70 && ty <= 99) {
                                ts.y = 1900 + ts.y
                            } else {
                                if (ty >= 0 && ty <= 69) {
                                    ts.y = 2000 + ts.y
                                }
                            }
                            timestamp = new Date(ts.y, ts.m, ts.d, ts.h, ts.i, ts.s, ts.u);
                            if (offset > 0) {
                                timestamp.setTime(Number(Number(timestamp) + (offset * 60 * 1000)))
                            }
                        }
                    }
                }
            } else {
                timestamp = new Date(ts.y, ts.m, ts.d, ts.h, ts.i, ts.s, ts.u)
            }
            if (opts.userLocalTime && offset === 0) {
                offset -= (new Date()).getTimezoneOffset();
                if (offset > 0) {
                    timestamp.setTime(Number(Number(timestamp) + (offset * 60 * 1000)))
                }
            }
            if (newformat === undefined) {
                return timestamp
            }
            if (opts.masks.hasOwnProperty(newformat)) {
                newformat = opts.masks[newformat]
            } else {
                if (!newformat) {
                    newformat = "Y-m-d"
                }
            }
            var G = timestamp.getHours(),
            i = timestamp.getMinutes(),
            j = timestamp.getDate(),
            n = timestamp.getMonth() + 1,
            o = timestamp.getTimezoneOffset(),
            s = timestamp.getSeconds(),
            u = timestamp.getMilliseconds(),
            w = timestamp.getDay(),
            Y = timestamp.getFullYear(),
            N = (w + 6) % 7 + 1,
            z = (new Date(Y, n - 1, j) - new Date(Y, 0, 1)) / 86400000,
            flags = {
                d: pad(j),
                D: opts.dayNames[w],
                j: j,
                l: opts.dayNames[w + 7],
                N: N,
                S: opts.S(j),
                w: w,
                z: z,
                W: N < 5 ? Math.floor((z + N - 1) / 7) + 1 : Math.floor((z + N - 1) / 7) || ((new Date(Y - 1, 0, 1).getDay() + 6) % 7 < 4 ? 53 : 52),
                F: opts.monthNames[n - 1 + 12],
                m: pad(n),
                M: opts.monthNames[n - 1],
                n: n,
                t: "?",
                L: "?",
                o: "?",
                Y: Y,
                y: String(Y).substring(2),
                a: G < 12 ? opts.AmPm[0] : opts.AmPm[1],
                A: G < 12 ? opts.AmPm[2] : opts.AmPm[3],
                B: "?",
                g: G % 12 || 12,
                G: G,
                h: pad(G % 12 || 12),
                H: pad(G),
                i: pad(i),
                s: pad(s),
                u: u,
                e: "?",
                I: "?",
                O: (o > 0 ? "-": "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                P: "?",
                T: (String(timestamp).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                Z: "?",
                c: "?",
                r: "?",
                U: Math.floor(timestamp / 1000)
            };
            return newformat.replace(token,
            function($0) {
                return flags.hasOwnProperty($0) ? flags[$0] : $0.substring(1)
            })
        },
        jqID: function(sid) {
            return String(sid).replace(/[!"#$%&'()*+,.\/:; <=>?@\[\\\]\^`{|}~]/g, "_")
        },
        guid: 1,
        uidPref: "jqg",
        randId: function(prefix) {
            return (prefix || $.jgrid.uidPref) + ($.jgrid.guid++)
        },
        getAccessor: function(obj, expr) {
            var ret, p, prm = [],
            i;
            if (typeof expr === "function") {
                return expr(obj)
            }
            if (typeof expr === "string" && expr.indexOf("['") != -1 && expr.indexOf("']") != -1) {
                expr = expr.replace(/\[\'/g, ".").replace(/\'\]/g, "")
            }
            ret = obj[expr];
            if (ret === undefined) {
                try {
                    if (typeof expr === "string") {
                        prm = expr.split(".")
                    }
                    i = prm.length;
                    if (i) {
                        ret = obj;
                        while (ret && i--) {
                            p = prm.shift();
                            ret = ret[p]
                        }
                    }
                } catch(e) {}
            }
            return ret
        },
        getXmlData: function(obj, expr, returnObj) {
            var ret, m = typeof expr === "string" ? expr.match(/^(.*)\[(\w+)\]$/) : null;
            if (typeof expr === "function") {
                return expr(obj)
            }
            if (m && m[2]) {
                return m[1] ? $(m[1], obj).attr(m[2]) : $(obj).attr(m[2])
            }
            ret = $(expr, obj);
            if (returnObj) {
                return ret
            }
            return ret.length > 0 ? $(ret).text() : undefined
        },
        cellWidth: function() {
            var $testDiv = $("<div class='ui-jqgrid' style='left:10000px'><table class='ui-jqgrid-btable' style='width:5px;'><tr class='jqgrow'><td style='width:5px;display:block;'></td></tr></table></div>"),
            testCell = $testDiv.appendTo("body").find("td").width();
            $testDiv.remove();
            return Math.abs(testCell - 5) > 0.1
        },
        cell_width: true,
        ajaxOptions: {},
        from: function(source) {
            var QueryObject = function(d, q) {
                if (typeof d === "string") {
                    d = $.data(d)
                }
                var self = this,
                _data = d,
                _usecase = true,
                _trim = false,
                _query = q,
                _stripNum = /[\$,%]/g,
                _lastCommand = null,
                _lastField = null,
                _orDepth = 0,
                _negate = false,
                _queuedOperator = "",
                _sorting = [],
                _useProperties = true;
                if (typeof d === "object" && d.push) {
                    if (d.length > 0) {
                        if (typeof d[0] !== "object") {
                            _useProperties = false
                        } else {
                            _useProperties = true
                        }
                    }
                } else {
                    throw "data provides is not an array"
                }
                this._hasData = function() {
                    return _data === null ? false: _data.length === 0 ? false: true
                };
                this._getStr = function(s) {
                    var phrase = [];
                    if (_trim) {
                        phrase.push("jQuery.trim(")
                    }
                    phrase.push("String(" + s + ")");
                    if (_trim) {
                        phrase.push(")")
                    }
                    if (!_usecase) {
                        phrase.push(".toLowerCase()")
                    }
                    return phrase.join("")
                };
                this._strComp = function(val) {
                    if (typeof val === "string") {
                        return ".toString()"
                    }
                    return ""
                };
                this._group = function(f, u) {
                    return ({
                        field: f.toString(),
                        unique: u,
                        items: []
                    })
                };
                this._toStr = function(phrase) {
                    if (_trim) {
                        phrase = $.trim(phrase)
                    }
                    phrase = phrase.toString().replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
                    return _usecase ? phrase: phrase.toLowerCase()
                };
                this._funcLoop = function(func) {
                    var results = [];
                    $.each(_data,
                    function(i, v) {
                        results.push(func(v))
                    });
                    return results
                };
                this._append = function(s) {
                    var i;
                    if (_query === null) {
                        _query = ""
                    } else {
                        _query += _queuedOperator === "" ? " && ": _queuedOperator
                    }
                    for (i = 0; i < _orDepth; i++) {
                        _query += "("
                    }
                    if (_negate) {
                        _query += "!"
                    }
                    _query += "(" + s + ")";
                    _negate = false;
                    _queuedOperator = "";
                    _orDepth = 0
                };
                this._setCommand = function(f, c) {
                    _lastCommand = f;
                    _lastField = c
                };
                this._resetNegate = function() {
                    _negate = false
                };
                this._repeatCommand = function(f, v) {
                    if (_lastCommand === null) {
                        return self
                    }
                    if (f !== null && v !== null) {
                        return _lastCommand(f, v)
                    }
                    if (_lastField === null) {
                        return _lastCommand(f)
                    }
                    if (!_useProperties) {
                        return _lastCommand(f)
                    }
                    return _lastCommand(_lastField, f)
                };
                this._equals = function(a, b) {
                    return (self._compare(a, b, 1) === 0)
                };
                this._compare = function(a, b, d) {
                    var toString = Object.prototype.toString;
                    if (d === undefined) {
                        d = 1
                    }
                    if (a === undefined) {
                        a = null
                    }
                    if (b === undefined) {
                        b = null
                    }
                    if (a === null && b === null) {
                        return 0
                    }
                    if (a === null && b !== null) {
                        return 1
                    }
                    if (a !== null && b === null) {
                        return - 1
                    }
                    if (toString.call(a) === "[object Date]" && toString.call(b) === "[object Date]") {
                        if (a < b) {
                            return - d
                        }
                        if (a > b) {
                            return d
                        }
                        return 0
                    }
                    if (!_usecase && typeof a !== "number" && typeof b !== "number") {
                        a = String(a);
                        b = String(b)
                    }
                    if (a < b) {
                        return - d
                    }
                    if (a > b) {
                        return d
                    }
                    return 0
                };
                this._performSort = function() {
                    if (_sorting.length === 0) {
                        return
                    }
                    _data = self._doSort(_data, 0)
                };
                this._doSort = function(d, q) {
                    var by = _sorting[q].by,
                    dir = _sorting[q].dir,
                    type = _sorting[q].type,
                    dfmt = _sorting[q].datefmt,
                    sfunc = _sorting[q].sfunc;
                    if (q === _sorting.length - 1) {
                        return self._getOrder(d, by, dir, type, dfmt, sfunc)
                    }
                    q++;
                    var values = self._getGroup(d, by, dir, type, dfmt),
                    results = [],
                    i,
                    j,
                    sorted;
                    for (i = 0; i < values.length; i++) {
                        sorted = self._doSort(values[i].items, q);
                        for (j = 0; j < sorted.length; j++) {
                            results.push(sorted[j])
                        }
                    }
                    return results
                };
                this._getOrder = function(data, by, dir, type, dfmt, sfunc) {
                    var sortData = [],
                    _sortData = [],
                    newDir = dir === "a" ? 1 : -1,
                    i,
                    ab,
                    j,
                    findSortKey;
                    if (type === undefined) {
                        type = "text"
                    }
                    if (type === "float" || type === "number" || type === "currency" || type === "numeric") {
                        findSortKey = function($cell) {
                            var key = parseFloat(String($cell).replace(_stripNum, ""));
                            return isNaN(key) ? Number.NEGATIVE_INFINITY: key
                        }
                    } else {
                        if (type === "int" || type === "integer") {
                            findSortKey = function($cell) {
                                return $cell ? parseFloat(String($cell).replace(_stripNum, "")) : Number.NEGATIVE_INFINITY
                            }
                        } else {
                            if (type === "date" || type === "datetime") {
                                findSortKey = function($cell) {
                                    return $.jgrid.parseDate(dfmt, $cell).getTime()
                                }
                            } else {
                                if ($.isFunction(type)) {
                                    findSortKey = type
                                } else {
                                    findSortKey = function($cell) {
                                        $cell = $cell ? $.trim(String($cell)) : "";
                                        return _usecase ? $cell: $cell.toLowerCase()
                                    }
                                }
                            }
                        }
                    }
                    $.each(data,
                    function(i, v) {
                        ab = by !== "" ? $.jgrid.getAccessor(v, by) : v;
                        if (ab === undefined) {
                            ab = ""
                        }
                        ab = findSortKey(ab, v);
                        _sortData.push({
                            vSort: ab,
                            index: i
                        })
                    });
                    if ($.isFunction(sfunc)) {
                        _sortData.sort(function(a, b) {
                            a = a.vSort;
                            b = b.vSort;
                            return sfunc.call(this, a, b, newDir)
                        })
                    } else {
                        _sortData.sort(function(a, b) {
                            a = a.vSort;
                            b = b.vSort;
                            return self._compare(a, b, newDir)
                        })
                    }
                    j = 0;
                    var nrec = data.length;
                    while (j < nrec) {
                        i = _sortData[j].index;
                        sortData.push(data[i]);
                        j++
                    }
                    return sortData
                };
                this._getGroup = function(data, by, dir, type, dfmt) {
                    var results = [],
                    group = null,
                    last = null,
                    val;
                    $.each(self._getOrder(data, by, dir, type, dfmt),
                    function(i, v) {
                        val = $.jgrid.getAccessor(v, by);
                        if (val == null) {
                            val = ""
                        }
                        if (!self._equals(last, val)) {
                            last = val;
                            if (group !== null) {
                                results.push(group)
                            }
                            group = self._group(by, val)
                        }
                        group.items.push(v)
                    });
                    if (group !== null) {
                        results.push(group)
                    }
                    return results
                };
                this.ignoreCase = function() {
                    _usecase = false;
                    return self
                };
                this.useCase = function() {
                    _usecase = true;
                    return self
                };
                this.trim = function() {
                    _trim = true;
                    return self
                };
                this.noTrim = function() {
                    _trim = false;
                    return self
                };
                this.execute = function() {
                    var match = _query,
                    results = [];
                    if (match === null) {
                        return self
                    }
                    $.each(_data,
                    function() {
                        if (eval(match)) {
                            results.push(this)
                        }
                    });
                    _data = results;
                    return self
                };
                this.data = function() {
                    return _data
                };
                this.select = function(f) {
                    self._performSort();
                    if (!self._hasData()) {
                        return []
                    }
                    self.execute();
                    if ($.isFunction(f)) {
                        var results = [];
                        $.each(_data,
                        function(i, v) {
                            results.push(f(v))
                        });
                        return results
                    }
                    return _data
                };
                this.hasMatch = function() {
                    if (!self._hasData()) {
                        return false
                    }
                    self.execute();
                    return _data.length > 0
                };
                this.andNot = function(f, v, x) {
                    _negate = !_negate;
                    return self.and(f, v, x)
                };
                this.orNot = function(f, v, x) {
                    _negate = !_negate;
                    return self.or(f, v, x)
                };
                this.not = function(f, v, x) {
                    return self.andNot(f, v, x)
                };
                this.and = function(f, v, x) {
                    _queuedOperator = " && ";
                    if (f === undefined) {
                        return self
                    }
                    return self._repeatCommand(f, v, x)
                };
                this.or = function(f, v, x) {
                    _queuedOperator = " || ";
                    if (f === undefined) {
                        return self
                    }
                    return self._repeatCommand(f, v, x)
                };
                this.orBegin = function() {
                    _orDepth++;
                    return self
                };
                this.orEnd = function() {
                    if (_query !== null) {
                        _query += ")"
                    }
                    return self
                };
                this.isNot = function(f) {
                    _negate = !_negate;
                    return self.is(f)
                };
                this.is = function(f) {
                    self._append("this." + f);
                    self._resetNegate();
                    return self
                };
                this._compareValues = function(func, f, v, how, t) {
                    var fld;
                    if (_useProperties) {
                        fld = "jQuery.jgrid.getAccessor(this,'" + f + "')"
                    } else {
                        fld = "this"
                    }
                    if (v === undefined) {
                        v = null
                    }
                    var val = v,
                    swst = t.stype === undefined ? "text": t.stype;
                    if (v !== null) {
                        switch (swst) {
                        case "int":
                        case "integer":
                            val = (isNaN(Number(val)) || val === "") ? "0": val;
                            fld = "parseInt(" + fld + ",10)";
                            val = "parseInt(" + val + ",10)";
                            break;
                        case "float":
                        case "number":
                        case "numeric":
                            val = String(val).replace(_stripNum, "");
                            val = (isNaN(Number(val)) || val === "") ? "0": val;
                            fld = "parseFloat(" + fld + ")";
                            val = "parseFloat(" + val + ")";
                            break;
                        case "date":
                        case "datetime":
                            val = String($.jgrid.parseDate(t.newfmt || "Y-m-d", val).getTime());
                            fld = 'jQuery.jgrid.parseDate("' + t.srcfmt + '",' + fld + ").getTime()";
                            break;
                        default:
                            fld = self._getStr(fld);
                            val = self._getStr('"' + self._toStr(val) + '"')
                        }
                    }
                    self._append(fld + " " + how + " " + val);
                    self._setCommand(func, f);
                    self._resetNegate();
                    return self
                };
                this.equals = function(f, v, t) {
                    return self._compareValues(self.equals, f, v, "==", t)
                };
                this.notEquals = function(f, v, t) {
                    return self._compareValues(self.equals, f, v, "!==", t)
                };
                this.isNull = function(f, v, t) {
                    return self._compareValues(self.equals, f, null, "===", t)
                };
                this.greater = function(f, v, t) {
                    return self._compareValues(self.greater, f, v, ">", t)
                };
                this.less = function(f, v, t) {
                    return self._compareValues(self.less, f, v, "<", t)
                };
                this.greaterOrEquals = function(f, v, t) {
                    return self._compareValues(self.greaterOrEquals, f, v, ">=", t)
                };
                this.lessOrEquals = function(f, v, t) {
                    return self._compareValues(self.lessOrEquals, f, v, "<=", t)
                };
                this.startsWith = function(f, v) {
                    var val = (v == null) ? f: v,
                    length = _trim ? $.trim(val.toString()).length: val.toString().length;
                    if (_useProperties) {
                        self._append(self._getStr("jQuery.jgrid.getAccessor(this,'" + f + "')") + ".substr(0," + length + ") == " + self._getStr('"' + self._toStr(v) + '"'))
                    } else {
                        if (v != null) {
                            length = _trim ? $.trim(v.toString()).length: v.toString().length
                        }
                        self._append(self._getStr("this") + ".substr(0," + length + ") == " + self._getStr('"' + self._toStr(f) + '"'))
                    }
                    self._setCommand(self.startsWith, f);
                    self._resetNegate();
                    return self
                };
                this.endsWith = function(f, v) {
                    var val = (v == null) ? f: v,
                    length = _trim ? $.trim(val.toString()).length: val.toString().length;
                    if (_useProperties) {
                        self._append(self._getStr("jQuery.jgrid.getAccessor(this,'" + f + "')") + ".substr(" + self._getStr("jQuery.jgrid.getAccessor(this,'" + f + "')") + ".length-" + length + "," + length + ') == "' + self._toStr(v) + '"')
                    } else {
                        self._append(self._getStr("this") + ".substr(" + self._getStr("this") + '.length-"' + self._toStr(f) + '".length,"' + self._toStr(f) + '".length) == "' + self._toStr(f) + '"')
                    }
                    self._setCommand(self.endsWith, f);
                    self._resetNegate();
                    return self
                };
                this.contains = function(f, v) {
                    if (_useProperties) {
                        self._append(self._getStr("jQuery.jgrid.getAccessor(this,'" + f + "')") + '.indexOf("' + self._toStr(v) + '",0) > -1')
                    } else {
                        self._append(self._getStr("this") + '.indexOf("' + self._toStr(f) + '",0) > -1')
                    }
                    self._setCommand(self.contains, f);
                    self._resetNegate();
                    return self
                };
                this.groupBy = function(by, dir, type, datefmt) {
                    if (!self._hasData()) {
                        return null
                    }
                    return self._getGroup(_data, by, dir, type, datefmt)
                };
                this.orderBy = function(by, dir, stype, dfmt, sfunc) {
                    dir = dir == null ? "a": $.trim(dir.toString().toLowerCase());
                    if (stype == null) {
                        stype = "text"
                    }
                    if (dfmt == null) {
                        dfmt = "Y-m-d"
                    }
                    if (sfunc == null) {
                        sfunc = false
                    }
                    if (dir === "desc" || dir === "descending") {
                        dir = "d"
                    }
                    if (dir === "asc" || dir === "ascending") {
                        dir = "a"
                    }
                    _sorting.push({
                        by: by,
                        dir: dir,
                        type: stype,
                        datefmt: dfmt,
                        sfunc: sfunc
                    });
                    return self
                };
                return self
            };
            return new QueryObject(source, null)
        },
        getMethod: function(name) {
            return this.getAccessor($.fn.jqGrid, name)
        },
        extend: function(methods) {
            $.extend($.fn.jqGrid, methods);
            if (!this.no_legacy_api) {
                $.fn.extend(methods)
            }
        }
    });
    $.fn.jqGrid = function(pin) {
        if (typeof pin === "string") {
            var fn = $.jgrid.getMethod(pin);
            if (!fn) {
                throw ("jqGrid - No such method: " + pin)
            }
            var args = $.makeArray(arguments).slice(1);
            return fn.apply(this, args)
        }
        return this.each(function() {
            if (this.grid) {
                return
            }
            var localData;
            if (pin != null && pin.data !== undefined) {
                localData = pin.data;
                pin.data = []
            }
            var p = $.extend(true, {
                url: "",
                height: 150,
                page: 1,
                rowNum: 20,
                rowTotal: null,
                records: 0,
                pager: "",
                pgbuttons: true,
                pginput: true,
                colModel: [],
                rowList: [],
                colNames: [],
                sortorder: "asc",
                sortname: "",
                datatype: "xml",
                mtype: "GET",
                altRows: false,
                selarrrow: [],
                savedRow: [],
                shrinkToFit: true,
                xmlReader: {},
                jsonReader: {},
                subGrid: false,
                subGridModel: [],
                reccount: 0,
                lastpage: 0,
                lastsort: 0,
                selrow: null,
                beforeSelectRow: null,
                onSelectRow: null,
                onSortCol: null,
                ondblClickRow: null,
                onRightClickRow: null,
                onPaging: null,
                onSelectAll: null,
                onInitGrid: null,
                loadComplete: null,
                gridComplete: null,
                loadError: null,
                loadBeforeSend: null,
                afterInsertRow: null,
                beforeRequest: null,
                beforeProcessing: null,
                onHeaderClick: null,
                viewrecords: false,
                loadonce: false,
                multiselect: false,
                multikey: false,
                editurl: null,
                search: false,
                caption: "",
                hidegrid: true,
                hiddengrid: false,
                postData: {},
                userData: {},
                treeGrid: false,
                treeGridModel: "nested",
                treeReader: {},
                treeANode: -1,
                ExpandColumn: null,
                tree_root_level: 0,
                prmNames: {
                    page: "page",
                    rows: "rows",
                    sort: "sidx",
                    order: "sord",
                    search: "_search",
                    nd: "nd",
                    id: "id",
                    oper: "oper",
                    editoper: "edit",
                    addoper: "add",
                    deloper: "del",
                    subgridid: "id",
                    npage: null,
                    totalrows: "totalrows"
                },
                forceFit: false,
                gridstate: "visible",
                cellEdit: false,
                cellsubmit: "remote",
                nv: 0,
                loadui: "enable",
                toolbar: [false, ""],
                scroll: false,
                multiboxonly: false,
                deselectAfterSort: true,
                scrollrows: false,
                autowidth: false,
                scrollOffset: 18,
                cellLayout: 5,
                subGridWidth: 20,
                multiselectWidth: 20,
                gridview: false,
                rownumWidth: 25,
                rownumbers: false,
                pagerpos: "center",
                recordpos: "right",
                footerrow: false,
                userDataOnFooter: false,
                hoverrows: true,
                altclass: "ui-priority-secondary",
                viewsortcols: [false, "vertical", true],
                resizeclass: "",
                autoencode: false,
                remapColumns: [],
                ajaxGridOptions: {},
                direction: "ltr",
                toppager: false,
                headertitles: false,
                scrollTimeout: 40,
                data: [],
                _index: {},
                grouping: false,
                groupingView: {
                    groupField: [],
                    groupOrder: [],
                    groupText: [],
                    groupColumnShow: [],
                    groupSummary: [],
                    showSummaryOnHide: false,
                    sortitems: [],
                    sortnames: [],
                    summary: [],
                    summaryval: [],
                    plusicon: "ui-icon-circlesmall-plus",
                    minusicon: "ui-icon-circlesmall-minus",
                    displayField: [],
                    groupSummaryPos: [],
                    formatDisplayField: [],
                    _locgr: false
                },
                ignoreCase: false,
                cmTemplate: {},
                idPrefix: "",
                multiSort: false,
                minColWidth: 33
            },
            $.jgrid.defaults, pin || {});
            if (localData !== undefined) {
                p.data = localData;
                pin.data = localData
            }
            var ts = this,
            grid = {
                headers: [],
                cols: [],
                footers: [],
                dragStart: function(i, x, y) {
                    var gridLeftPos = $(this.bDiv).offset().left;
                    this.resizing = {
                        idx: i,
                        startX: x.pageX,
                        sOL: x.pageX - gridLeftPos
                    };
                    this.hDiv.style.cursor = "col-resize";
                    this.curGbox = $("#rs_m" + $.jgrid.jqID(p.id), "#gbox_" + $.jgrid.jqID(p.id));
                    this.curGbox.css({
                        display: "block",
                        left: x.pageX - gridLeftPos,
                        top: y[1],
                        height: y[2]
                    });
                    $(ts).triggerHandler("jqGridResizeStart", [x, i]);
                    if ($.isFunction(p.resizeStart)) {
                        p.resizeStart.call(ts, x, i)
                    }
                    document.onselectstart = function() {
                        return false
                    }
                },
                dragMove: function(x) {
                    if (this.resizing) {
                        var diff = x.pageX - this.resizing.startX,
                        h = this.headers[this.resizing.idx],
                        newWidth = p.direction === "ltr" ? h.width + diff: h.width - diff,
                        hn,
                        nWn;
                        if (newWidth > 33) {
                            this.curGbox.css({
                                left: this.resizing.sOL + diff
                            });
                            if (p.forceFit === true) {
                                hn = this.headers[this.resizing.idx + p.nv];
                                nWn = p.direction === "ltr" ? hn.width - diff: hn.width + diff;
                                if (nWn > p.minColWidth) {
                                    h.newWidth = newWidth;
                                    hn.newWidth = nWn
                                }
                            } else {
                                this.newWidth = p.direction === "ltr" ? p.tblwidth + diff: p.tblwidth - diff;
                                h.newWidth = newWidth
                            }
                        }
                    }
                },
                dragEnd: function() {
                    this.hDiv.style.cursor = "default";
                    if (this.resizing) {
                        var idx = this.resizing.idx,
                        nw = this.headers[idx].newWidth || this.headers[idx].width;
                        nw = parseInt(nw, 10);
                        this.resizing = false;
                        $("#rs_m" + $.jgrid.jqID(p.id)).css("display", "none");
                        p.colModel[idx].width = nw;
                        this.headers[idx].width = nw;
                        this.headers[idx].el.style.width = nw + "px";
                        this.cols[idx].style.width = nw + "px";
                        if (this.footers.length > 0) {
                            this.footers[idx].style.width = nw + "px"
                        }
                        if (p.forceFit === true) {
                            nw = this.headers[idx + p.nv].newWidth || this.headers[idx + p.nv].width;
                            this.headers[idx + p.nv].width = nw;
                            this.headers[idx + p.nv].el.style.width = nw + "px";
                            this.cols[idx + p.nv].style.width = nw + "px";
                            if (this.footers.length > 0) {
                                this.footers[idx + p.nv].style.width = nw + "px"
                            }
                            p.colModel[idx + p.nv].width = nw
                        } else {
                            p.tblwidth = this.newWidth || p.tblwidth;
                            $("table:first", this.bDiv).css("width", p.tblwidth + "px");
                            $("table:first", this.hDiv).css("width", p.tblwidth + "px");
                            this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                            if (p.footerrow) {
                                $("table:first", this.sDiv).css("width", p.tblwidth + "px");
                                this.sDiv.scrollLeft = this.bDiv.scrollLeft
                            }
                        }
                        $(ts).triggerHandler("jqGridResizeStop", [nw, idx]);
                        if ($.isFunction(p.resizeStop)) {
                            p.resizeStop.call(ts, nw, idx)
                        }
                    }
                    this.curGbox = null;
                    document.onselectstart = function() {
                        return true
                    }
                },
                populateVisible: function() {
                    if (grid.timer) {
                        clearTimeout(grid.timer)
                    }
                    grid.timer = null;
                    var dh = $(grid.bDiv).height();
                    if (!dh) {
                        return
                    }
                    var table = $("table:first", grid.bDiv);
                    var rows, rh;
                    if (table[0].rows.length) {
                        try {
                            rows = table[0].rows[1];
                            rh = rows ? $(rows).outerHeight() || grid.prevRowHeight: grid.prevRowHeight
                        } catch(pv) {
                            rh = grid.prevRowHeight
                        }
                    }
                    if (!rh) {
                        return
                    }
                    grid.prevRowHeight = rh;
                    var rn = p.rowNum;
                    var scrollTop = grid.scrollTop = grid.bDiv.scrollTop;
                    var ttop = Math.round(table.position().top) - scrollTop;
                    var tbot = ttop + table.height();
                    var div = rh * rn;
                    var page, npage, empty;
                    if (tbot < dh && ttop <= 0 && (p.lastpage === undefined || (parseInt((tbot + scrollTop + div - 1) / div, 10) || 0) <= p.lastpage)) {
                        npage = parseInt((dh - tbot + div - 1) / div, 10) || 1;
                        if (tbot >= 0 || npage < 2 || p.scroll === true) {
                            page = (Math.round((tbot + scrollTop) / div) || 0) + 1;
                            ttop = -1
                        } else {
                            ttop = 1
                        }
                    }
                    if (ttop > 0) {
                        page = (parseInt(scrollTop / div, 10) || 0) + 1;
                        npage = (parseInt((scrollTop + dh) / div, 10) || 0) + 2 - page;
                        empty = true
                    }
                    if (npage) {
                        if (p.lastpage && (page > p.lastpage || p.lastpage === 1 || (page === p.page && page === p.lastpage))) {
                            return
                        }
                        if (grid.hDiv.loading) {
                            grid.timer = setTimeout(grid.populateVisible, p.scrollTimeout)
                        } else {
                            p.page = page;
                            if (empty) {
                                grid.selectionPreserver(table[0]);
                                grid.emptyRows.call(table[0], false, false)
                            }
                            grid.populate(npage)
                        }
                    }
                },
                scrollGrid: function(e) {
                    if (p.scroll) {
                        var scrollTop = grid.bDiv.scrollTop;
                        if (grid.scrollTop === undefined) {
                            grid.scrollTop = 0
                        }
                        if (scrollTop !== grid.scrollTop) {
                            grid.scrollTop = scrollTop;
                            if (grid.timer) {
                                clearTimeout(grid.timer)
                            }
                            grid.timer = setTimeout(grid.populateVisible, p.scrollTimeout)
                        }
                    }
                    grid.hDiv.scrollLeft = grid.bDiv.scrollLeft;
                    if (p.footerrow) {
                        grid.sDiv.scrollLeft = grid.bDiv.scrollLeft
                    }
                    if (e) {
                        e.stopPropagation()
                    }
                },
                selectionPreserver: function(ts) {
                    var p = ts.p,
                    sr = p.selrow,
                    sra = p.selarrrow ? $.makeArray(p.selarrrow) : null,
                    left = ts.grid.bDiv.scrollLeft,
                    restoreSelection = function() {
                        var i;
                        p.selrow = null;
                        p.selarrrow = [];
                        if (p.multiselect && sra && sra.length > 0) {
                            for (i = 0; i < sra.length; i++) {
                                if (sra[i] !== sr) {
                                    $(ts).jqGrid("setSelection", sra[i], false, null)
                                }
                            }
                        }
                        if (sr) {
                            $(ts).jqGrid("setSelection", sr, false, null)
                        }
                        ts.grid.bDiv.scrollLeft = left;
                        $(ts).unbind(".selectionPreserver", restoreSelection)
                    };
                    $(ts).bind("jqGridGridComplete.selectionPreserver", restoreSelection)
                }
            };
            if (this.tagName.toUpperCase() !== "TABLE" || this.id == null) {
                alert("Element is not a table or has no id!");
                return
            }
            if (document.documentMode !== undefined) {
                if (document.documentMode <= 5) {
                    alert("Grid can not be used in this ('quirks') mode!");
                    return
                }
            }
            $(this).empty().attr("tabindex", "0");
            this.p = p;
            this.p.useProp = !!$.fn.prop;
            var i, dir;
            if (this.p.colNames.length === 0) {
                for (i = 0; i < this.p.colModel.length; i++) {
                    this.p.colNames[i] = this.p.colModel[i].label || this.p.colModel[i].name
                }
            }
            if (this.p.colNames.length !== this.p.colModel.length) {
                alert($.jgrid.errors.model);
                return
            }
            var gv = $("<div class='ui-jqgrid-view' role='grid'></div>"),
            isMSIE = $.jgrid.msie;
            ts.p.direction = $.trim(ts.p.direction.toLowerCase());
            if ($.inArray(ts.p.direction, ["ltr", "rtl"]) === -1) {
                ts.p.direction = "ltr"
            }
            dir = ts.p.direction;
            $(gv).insertBefore(this);
            $(this).removeClass("scroll").appendTo(gv);
            var eg = $("<div class='ui-jqgrid ui-widget ui-widget-content ui-corner-all'></div>");
            $(eg).attr({
                id: "gbox_" + this.id,
                dir: dir
            }).insertBefore(gv);
            $(gv).attr("id", "gview_" + this.id).appendTo(eg);
            $("<div class='ui-widget-overlay jqgrid-overlay' id='lui_" + this.id + "'></div>").insertBefore(gv);
            $("<div class='loading ui-state-default ui-state-active' id='load_" + this.id + "'>" + this.p.loadtext + "</div>").insertBefore(gv);
            $(this).attr({
                cellspacing: "0",
                cellpadding: "0",
                border: "0",
                role: "presentation",
                "aria-multiselectable": !!this.p.multiselect,
                "aria-labelledby": "gbox_" + this.id
            });
            var sortkeys = ["shiftKey", "altKey", "ctrlKey"],
            intNum = function(val, defval) {
                val = parseInt(val, 10);
                if (isNaN(val)) {
                    return defval || 0
                }
                return val
            },
            formatCol = function(pos, rowInd, tv, rawObject, rowId, rdata) {
                var cm = ts.p.colModel[pos],
                cellAttrFunc,
                ral = cm.align,
                result = 'style="',
                clas = cm.classes,
                nm = cm.name,
                celp,
                acp = [];
                if (nm == "actions") {
                    clas = "actions " + (clas ? clas: "")
                }
                if (ral) {
                    result += "text-align:" + ral + ";"
                }
                if (cm.hidden === true) {
                    result += "display:none;"
                }
                if (rowInd === 0) {
                    result += "width: " + grid.headers[pos].width + "px;"
                } else {
                    if ($.isFunction(cm.cellattr) || (typeof cm.cellattr === "string" && $.jgrid.cellattr != null && $.isFunction($.jgrid.cellattr[cm.cellattr]))) {
                        cellAttrFunc = $.isFunction(cm.cellattr) ? cm.cellattr: $.jgrid.cellattr[cm.cellattr];
                        celp = cellAttrFunc.call(ts, rowId, tv, rawObject, cm, rdata);
                        if (celp && typeof celp === "string") {
                            celp = celp.replace(/style/i, "style").replace(/title/i, "title");
                            if (celp.indexOf("title") > -1) {
                                cm.title = false
                            }
                            if (celp.indexOf("class") > -1) {
                                clas = undefined
                            }
                            acp = celp.replace(/\-style/g, "-sti").split(/style/);
                            if (acp.length === 2) {
                                acp[1] = $.trim(acp[1].replace(/\-sti/g, "-style").replace("=", ""));
                                if (acp[1].indexOf("'") === 0 || acp[1].indexOf('"') === 0) {
                                    acp[1] = acp[1].substring(1)
                                }
                                result += acp[1].replace(/'/gi, '"')
                            } else {
                                result += '"'
                            }
                        }
                    }
                }
                if (!acp.length) {
                    acp[0] = "";
                    result += '"'
                }
                result += (clas !== undefined ? (' class="' + clas + '"') : "") + ((cm.title && tv) ? (' title="' + $.jgrid.stripHtml(tv) + '"') : "");
                result += ' aria-describedby="' + ts.p.id + "_" + nm + '"';
                return result + acp[0]
            },
            cellVal = function(val) {
                return val == null || val === "" ? "&#160;": (ts.p.autoencode ? $.jgrid.htmlEncode(val) : String(val))
            },
            formatter = function(rowId, cellval, colpos, rwdat, _act, irow) {
                var cm = ts.p.colModel[colpos],
                v;
                rowId = String(ts.p.idPrefix) !== "" ? $.jgrid.stripPref(ts.p.idPrefix, rowId) : rowId;
                if (!cm.data) {
                    cm.data = {}
                }
                cm.data[rowId] = cellval || "";
                if (cm.formatter !== undefined) {
                    var opts = {
                        rowId: rowId,
                        colModel: cm,
                        gid: ts.p.id,
                        pos: colpos,
                        irow: irow
                    };
                    if ($.isFunction(cm.formatter)) {
                        v = cm.formatter.call(ts, cellval, opts, rwdat, _act)
                    } else {
                        if ($.fmatter) {
                            v = $.fn.fmatter.call(ts, cm.formatter, cellval, opts, rwdat, _act)
                        } else {
                            v = cellVal(cellval)
                        }
                    }
                } else {
                    v = cellVal(cellval)
                }
                return v
            },
            addCell = function(rowId, cell, pos, irow, srvr, rdata) {
                var v, prp;
                v = formatter(rowId, cell, pos, srvr, "add", irow);
                prp = formatCol(pos, irow, v, srvr, rowId, rdata);
                return '<td role="gridcell" ' + prp + ">" + v + "</td>"
            },
            addMulti = function(rowid, pos, irow, checked) {
                var v, prp;
                v = '<input role="checkbox" type="checkbox" id="jqg_' + ts.p.id + "_" + rowid + '" class="cbox noselect2" name="jqg_' + ts.p.id + "_" + rowid + '"' + (checked ? 'checked="checked"': "") + "/>",
                prp = formatCol(pos, irow, "", null, rowid, true);
                return '<td role="gridcell" ' + prp + ">" + v + "</td>"
            },
            addRowNum = function(pos, irow, pG, rN) {
                var v = (parseInt(pG, 10) - 1) * parseInt(rN, 10) + 1 + irow,
                prp = formatCol(pos, irow, v, null, irow, true);
                return '<td role="gridcell" class="ui-state-default jqgrid-rownum" ' + prp + ">" + v + "</td>"
            },
            reader = function(datatype) {
                var field, f = [],
                j = 0,
                i;
                for (i = 0; i < ts.p.colModel.length; i++) {
                    field = ts.p.colModel[i];
                    if (field.name !== "cb" && field.name !== "subgrid" && field.name !== "rn") {
                        f[j] = datatype === "local" ? field.name: ((datatype === "xml" || datatype === "xmlstring") ? field.xmlmap || field.name: field.jsonmap || field.name);
                        if (ts.p.keyName !== false && field.key === true) {
                            ts.p.keyName = f[j]
                        }
                        j++
                    }
                }
                return f
            },
            orderedCols = function(offset) {
                var order = ts.p.remapColumns;
                if (!order || !order.length) {
                    order = $.map(ts.p.colModel,
                    function(v, i) {
                        return i
                    })
                }
                if (offset) {
                    order = $.map(order,
                    function(v) {
                        return v < offset ? null: v - offset
                    })
                }
                return order
            },
            emptyRows = function(scroll, locdata) {
                var firstrow;
                if (this.p.deepempty) {
                    $(this.rows).slice(1).remove()
                } else {
                    firstrow = this.rows.length > 0 ? this.rows[0] : null;
                    $(this.firstChild).empty().append(firstrow)
                }
                if (scroll && this.p.scroll) {
                    $(this.grid.bDiv.firstChild).css({
                        height: "auto"
                    });
                    $(this.grid.bDiv.firstChild.firstChild).css({
                        height: 0,
                        display: "none"
                    });
                    if (this.grid.bDiv.scrollTop !== 0) {
                        this.grid.bDiv.scrollTop = 0
                    }
                }
                if (locdata === true && this.p.treeGrid) {
                    this.p.data = [];
                    this.p._index = {}
                }
            },
            normalizeData = function() {
                var p = ts.p,
                data = p.data,
                dataLength = data.length,
                i, j, cur, idn, idr, ccur, v, rd, localReader = p.localReader,
                colModel = p.colModel,
                cellName = localReader.cell,
                iOffset = (p.multiselect === true ? 1 : 0) + (p.subGrid === true ? 1 : 0) + (p.rownumbers === true ? 1 : 0),
                br = p.scroll ? $.jgrid.randId() : 1,
                arrayReader,
                objectReader,
                rowReader;
                if (p.datatype !== "local" || localReader.repeatitems !== true) {
                    return
                }
                arrayReader = orderedCols(iOffset);
                objectReader = reader("local");
                idn = p.keyIndex === false ? ($.isFunction(localReader.id) ? localReader.id.call(ts, data) : localReader.id) : p.keyIndex;
                for (i = 0; i < dataLength; i++) {
                    cur = data[i];
                    idr = $.jgrid.getAccessor(cur, idn);
                    if (idr === undefined) {
                        if (typeof idn === "number" && colModel[idn + iOffset] != null) {
                            idr = $.jgrid.getAccessor(cur, colModel[idn + iOffset].name)
                        }
                        if (idr === undefined) {
                            idr = br + i;
                            if (cellName) {
                                ccur = $.jgrid.getAccessor(cur, cellName) || cur;
                                idr = ccur != null && ccur[idn] !== undefined ? ccur[idn] : idr;
                                ccur = null
                            }
                        }
                    }
                    rd = {};
                    rd[localReader.id] = idr;
                    if (cellName) {
                        cur = $.jgrid.getAccessor(cur, cellName) || cur
                    }
                    rowReader = $.isArray(cur) ? arrayReader: objectReader;
                    for (j = 0; j < rowReader.length; j++) {
                        v = $.jgrid.getAccessor(cur, rowReader[j]);
                        rd[colModel[j + iOffset].name] = v
                    }
                    $.extend(true, data[i], rd)
                }
            },
            refreshIndex = function() {
                var datalen = ts.p.data.length,
                idname, i, val;
                if (ts.p.keyName === false || ts.p.loadonce === true) {
                    idname = ts.p.localReader.id
                } else {
                    idname = ts.p.keyName
                }
                ts.p._index = [];
                for (i = 0; i < datalen; i++) {
                    val = $.jgrid.getAccessor(ts.p.data[i], idname);
                    if (val === undefined) {
                        val = String(i + 1)
                    }
                    ts.p._index[val] = i
                }
            },
            constructTr = function(id, hide, altClass, rd, cur, selected) {
                var tabindex = "-1",
                restAttr = "",
                attrName, style = hide ? "display:none;": "",
                classes = "ui-widget-content jqgrow ui-row-" + ts.p.direction + (altClass ? " " + altClass: "") + (selected ? " ui-state-highlight": ""),
                rowAttrObj = $(ts).triggerHandler("jqGridRowAttr", [rd, cur, id]);
                if (typeof rowAttrObj !== "object") {
                    rowAttrObj = $.isFunction(ts.p.rowattr) ? ts.p.rowattr.call(ts, rd, cur, id) : (typeof ts.p.rowattr === "string" && $.jgrid.rowattr != null && $.isFunction($.jgrid.rowattr[ts.p.rowattr]) ? $.jgrid.rowattr[ts.p.rowattr].call(ts, rd, cur, id) : {})
                }
                if (!$.isEmptyObject(rowAttrObj)) {
                    if (rowAttrObj.hasOwnProperty("id")) {
                        id = rowAttrObj.id;
                        delete rowAttrObj.id
                    }
                    if (rowAttrObj.hasOwnProperty("tabindex")) {
                        tabindex = rowAttrObj.tabindex;
                        delete rowAttrObj.tabindex
                    }
                    if (rowAttrObj.hasOwnProperty("style")) {
                        style += rowAttrObj.style;
                        delete rowAttrObj.style
                    }
                    if (rowAttrObj.hasOwnProperty("class")) {
                        classes += " " + rowAttrObj["class"];
                        delete rowAttrObj["class"]
                    }
                    try {
                        delete rowAttrObj.role
                    } catch(ra) {}
                    for (attrName in rowAttrObj) {
                        if (rowAttrObj.hasOwnProperty(attrName)) {
                            restAttr += " " + attrName + "=" + rowAttrObj[attrName]
                        }
                    }
                }
                return '<tr role="row" id="' + id + '" tabindex="' + tabindex + '" class="' + classes + '"' + (style === "" ? "": ' style="' + style + '"') + restAttr + ">"
            },
            addXmlData = function(xml, t, rcnt, more, adjust) {
                var startReq = new Date(),
                locdata = (ts.p.datatype !== "local" && ts.p.loadonce) || ts.p.datatype === "xmlstring",
                xmlid = "_id_",
                xmlRd = ts.p.xmlReader,
                frd = ts.p.datatype === "local" ? "local": "xml";
                if (locdata) {
                    ts.p.data = [];
                    ts.p._index = {};
                    ts.p.localReader.id = xmlid
                }
                ts.p.reccount = 0;
                if ($.isXMLDoc(xml)) {
                    if (ts.p.treeANode === -1 && !ts.p.scroll) {
                        emptyRows.call(ts, false, true);
                        rcnt = 1
                    } else {
                        rcnt = rcnt > 1 ? rcnt: 1
                    }
                } else {
                    return
                }
                var self = $(ts),
                i,
                fpos,
                ir = 0,
                v,
                gi = ts.p.multiselect === true ? 1 : 0,
                si = 0,
                addSubGridCell,
                ni = ts.p.rownumbers === true ? 1 : 0,
                idn,
                getId,
                f = [],
                F,
                rd = {},
                xmlr,
                rid,
                rowData = [],
                cn = (ts.p.altRows === true) ? ts.p.altclass: "",
                cn1;
                if (ts.p.subGrid === true) {
                    si = 1;
                    addSubGridCell = $.jgrid.getMethod("addSubGridCell")
                }
                if (!xmlRd.repeatitems) {
                    f = reader(frd)
                }
                if (ts.p.keyName === false) {
                    idn = $.isFunction(xmlRd.id) ? xmlRd.id.call(ts, xml) : xmlRd.id
                } else {
                    idn = ts.p.keyName
                }
                if (String(idn).indexOf("[") === -1) {
                    if (f.length) {
                        getId = function(trow, k) {
                            return $(idn, trow).text() || k
                        }
                    } else {
                        getId = function(trow, k) {
                            return $(xmlRd.cell, trow).eq(idn).text() || k
                        }
                    }
                } else {
                    getId = function(trow, k) {
                        return trow.getAttribute(idn.replace(/[\[\]]/g, "")) || k
                    }
                }
                ts.p.userData = {};
                ts.p.page = intNum($.jgrid.getXmlData(xml, xmlRd.page), ts.p.page);
                ts.p.lastpage = intNum($.jgrid.getXmlData(xml, xmlRd.total), 1);
                ts.p.records = intNum($.jgrid.getXmlData(xml, xmlRd.records));
                if ($.isFunction(xmlRd.userdata)) {
                    ts.p.userData = xmlRd.userdata.call(ts, xml) || {}
                } else {
                    $.jgrid.getXmlData(xml, xmlRd.userdata, true).each(function() {
                        ts.p.userData[this.getAttribute("name")] = $(this).text()
                    })
                }
                var gxml = $.jgrid.getXmlData(xml, xmlRd.root, true);
                gxml = $.jgrid.getXmlData(gxml, xmlRd.row, true);
                if (!gxml) {
                    gxml = []
                }
                var gl = gxml.length,
                j = 0,
                grpdata = [],
                rn = parseInt(ts.p.rowNum, 10),
                br = ts.p.scroll ? $.jgrid.randId() : 1,
                altr;
                if (gl > 0 && ts.p.page <= 0) {
                    ts.p.page = 1
                }
                if (gxml && gl) {
                    if (adjust) {
                        rn *= adjust + 1
                    }
                    var afterInsRow = $.isFunction(ts.p.afterInsertRow),
                    hiderow = false,
                    groupingPrepare;
                    if (ts.p.grouping) {
                        hiderow = ts.p.groupingView.groupCollapse === true;
                        groupingPrepare = $.jgrid.getMethod("groupingPrepare")
                    }
                    while (j < gl) {
                        xmlr = gxml[j];
                        rid = getId(xmlr, br + j);
                        rid = ts.p.idPrefix + rid;
                        altr = rcnt === 0 ? 0 : rcnt + 1;
                        cn1 = (altr + j) % 2 === 1 ? cn: "";
                        var iStartTrTag = rowData.length;
                        rowData.push("");
                        if (ni) {
                            rowData.push(addRowNum(0, j, ts.p.page, ts.p.rowNum))
                        }
                        if (gi) {
                            rowData.push(addMulti(rid, ni, j, false))
                        }
                        if (si) {
                            rowData.push(addSubGridCell.call(self, gi + ni, j + rcnt))
                        }
                        if (xmlRd.repeatitems) {
                            if (!F) {
                                F = orderedCols(gi + si + ni)
                            }
                            var cells = $.jgrid.getXmlData(xmlr, xmlRd.cell, true);
                            $.each(F,
                            function(k) {
                                var cell = cells[this];
                                if (!cell) {
                                    return false
                                }
                                v = cell.textContent || cell.text;
                                rd[ts.p.colModel[k + gi + si + ni].name] = v;
                                rowData.push(addCell(rid, v, k + gi + si + ni, j + rcnt, xmlr, rd))
                            })
                        } else {
                            for (i = 0; i < f.length; i++) {
                                v = $.jgrid.getXmlData(xmlr, f[i]);
                                rd[ts.p.colModel[i + gi + si + ni].name] = v;
                                rowData.push(addCell(rid, v, i + gi + si + ni, j + rcnt, xmlr, rd))
                            }
                        }
                        rowData[iStartTrTag] = constructTr(rid, hiderow, cn1, rd, xmlr, false);
                        rowData.push("</tr>");
                        if (ts.p.grouping) {
                            grpdata.push(rowData);
                            if (!ts.p.groupingView._locgr) {
                                groupingPrepare.call(self, rd, j)
                            }
                            rowData = []
                        }
                        if (locdata || ts.p.treeGrid === true) {
                            rd[xmlid] = $.jgrid.stripPref(ts.p.idPrefix, rid);
                            ts.p.data.push(rd);
                            ts.p._index[rd[xmlid]] = ts.p.data.length - 1
                        }
                        if (ts.p.gridview === false) {
                            $("tbody:first", t).append(rowData.join(""));
                            self.triggerHandler("jqGridAfterInsertRow", [rid, rd, xmlr]);
                            if (afterInsRow) {
                                ts.p.afterInsertRow.call(ts, rid, rd, xmlr)
                            }
                            rowData = []
                        }
                        rd = {};
                        ir++;
                        j++;
                        if (ir === rn) {
                            break
                        }
                    }
                }
                if (ts.p.gridview === true) {
                    fpos = ts.p.treeANode > -1 ? ts.p.treeANode: 0;
                    if (ts.p.grouping) {
                        if (!locdata) {
                            self.jqGrid("groupingRender", grpdata, ts.p.colModel.length, ts.p.page, rn);
                            grpdata = null
                        }
                    } else {
                        if (ts.p.treeGrid === true && fpos > 0) {
                            $(ts.rows[fpos]).after(rowData.join(""))
                        } else {
                            ts.firstElementChild.innerHTML += rowData.join("");
                            ts.grid.cols = ts.rows[0].cells
                        }
                    }
                }
                if (ts.p.subGrid === true) {
                    try {
                        self.jqGrid("addSubGrid", gi + ni)
                    } catch(_) {}
                }
                ts.p.totaltime = new Date() - startReq;
                if (ir > 0) {
                    if (ts.p.records === 0) {
                        ts.p.records = gl
                    }
                }
                rowData = null;
                if (ts.p.treeGrid === true) {
                    try {
                        self.jqGrid("setTreeNode", fpos + 1, ir + fpos + 1)
                    } catch(e) {}
                }
                ts.p.reccount = ir;
                ts.p.treeANode = -1;
                if (ts.p.userDataOnFooter) {
                    self.jqGrid("footerData", "set", ts.p.userData, true)
                }
                if (locdata) {
                    ts.p.records = gl;
                    ts.p.lastpage = Math.ceil(gl / rn)
                }
                if (!more) {
                    ts.updatepager(false, true)
                }
                if (locdata) {
                    while (ir < gl) {
                        xmlr = gxml[ir];
                        rid = getId(xmlr, ir + br);
                        rid = ts.p.idPrefix + rid;
                        if (xmlRd.repeatitems) {
                            if (!F) {
                                F = orderedCols(gi + si + ni)
                            }
                            var cells2 = $.jgrid.getXmlData(xmlr, xmlRd.cell, true);
                            $.each(F,
                            function(k) {
                                var cell = cells2[this];
                                if (!cell) {
                                    return false
                                }
                                v = cell.textContent || cell.text;
                                rd[ts.p.colModel[k + gi + si + ni].name] = v
                            })
                        } else {
                            for (i = 0; i < f.length; i++) {
                                v = $.jgrid.getXmlData(xmlr, f[i]);
                                rd[ts.p.colModel[i + gi + si + ni].name] = v
                            }
                        }
                        rd[xmlid] = $.jgrid.stripPref(ts.p.idPrefix, rid);
                        if (ts.p.grouping) {
                            groupingPrepare.call(self, rd, ir)
                        }
                        ts.p.data.push(rd);
                        ts.p._index[rd[xmlid]] = ts.p.data.length - 1;
                        rd = {};
                        ir++
                    }
                    if (ts.p.grouping) {
                        ts.p.groupingView._locgr = true;
                        self.jqGrid("groupingRender", grpdata, ts.p.colModel.length, ts.p.page, rn);
                        grpdata = null
                    }
                }
            },
            addJSONData = function(data, t, rcnt, more, adjust) {
                var startReq = new Date();
                if(ts.p.reader != undefined){
                    ts.p.pageSize = ts.p.reader.pageSize;
                }
                if (data) {
                    if (ts.p.treeANode === -1 && !ts.p.scroll) {
                        emptyRows.call(ts, false, true);
                        rcnt = 1
                    } else {
                        rcnt = rcnt > 1 ? rcnt: 1
                    }
                } else {
                    return
                }
                var dReader, locid = "_id_",
                frd, locdata = (ts.p.datatype !== "local" && ts.p.loadonce) || ts.p.datatype === "jsonstring";
                if (locdata) {
                    ts.p.data = [];
                    ts.p._index = {};
                    ts.p.localReader.id = locid
                }
                ts.p.reccount = 0;
                if (ts.p.datatype === "local") {
                    dReader = ts.p.localReader;
                    frd = "local"
                } else {
                    dReader = ts.p.jsonReader;
                    frd = "json"
                }
                var self = $(ts),
                ir = 0,
                v,
                i,
                j,
                f = [],
                cur,
                gi = ts.p.multiselect ? 1 : 0,
                si = ts.p.subGrid === true ? 1 : 0,
                addSubGridCell,
                ni = ts.p.rownumbers === true ? 1 : 0,
                arrayReader = orderedCols(gi + si + ni),
                objectReader = reader(frd),
                rowReader,
                len,
                drows,
                idn,
                rd = {},
                fpos,
                idr,
                rowData = [],
                cn = (ts.p.altRows === true) ? ts.p.altclass: "",
                cn1;
                ts.p.page = intNum($.jgrid.getAccessor(data, dReader.page), ts.p.page);
                ts.p.lastpage = intNum($.jgrid.getAccessor(data, dReader.total), 1);
                ts.p.records = intNum($.jgrid.getAccessor(data, dReader.records));
                ts.p.userData = $.jgrid.getAccessor(data, dReader.userdata) || {};
                if (si) {
                    addSubGridCell = $.jgrid.getMethod("addSubGridCell")
                }
                if (ts.p.keyName === false) {
                    idn = $.isFunction(dReader.id) ? dReader.id.call(ts, data) : dReader.id
                } else {
                    idn = ts.p.keyName
                }
                drows = $.jgrid.getAccessor(data, dReader.root);
                if (drows == null && $.isArray(data)) {
                    drows = data
                }
                if (!drows) {
                    drows = []
                }
                len = drows.length;
                i = 0;
                if (len > 0 && ts.p.page <= 0) {
                    ts.p.page = 1
                }
                var rn = parseInt(ts.p.rowNum, 10),
                br = ts.p.scroll ? $.jgrid.randId() : 1,
                altr,
                selected = false,
                selr;
                if (adjust) {
                    rn *= adjust + 1
                }
                if (ts.p.datatype === "local" && !ts.p.deselectAfterSort) {
                    selected = true
                }
                var afterInsRow = $.isFunction(ts.p.afterInsertRow),
                grpdata = [],
                hiderow = false,
                groupingPrepare;
                if (ts.p.grouping) {
                    hiderow = ts.p.groupingView.groupCollapse === true;
                    groupingPrepare = $.jgrid.getMethod("groupingPrepare")
                }
                while (i < len) {
                    cur = drows[i];
                    idr = $.jgrid.getAccessor(cur, idn);
                    if (idr === undefined) {
                        if (typeof idn === "number" && ts.p.colModel[idn + gi + si + ni] != null) {
                            idr = $.jgrid.getAccessor(cur, ts.p.colModel[idn + gi + si + ni].name)
                        }
                        if (idr === undefined) {
                            idr = br + i;
                            if (f.length === 0) {
                                if (dReader.cell) {
                                    var ccur = $.jgrid.getAccessor(cur, dReader.cell) || cur;
                                    idr = ccur != null && ccur[idn] !== undefined ? ccur[idn] : idr;
                                    ccur = null
                                }
                            }
                        }
                    }
                    idr = ts.p.idPrefix + idr;
                    altr = rcnt === 1 ? 0 : rcnt;
                    cn1 = (altr + i) % 2 === 1 ? cn: "";
                    if (selected) {
                        if (ts.p.multiselect) {
                            selr = ($.inArray(idr, ts.p.selarrrow) !== -1)
                        } else {
                            selr = (idr === ts.p.selrow)
                        }
                    }
                    var iStartTrTag = rowData.length;
                    rowData.push("");
                    if (ni) {
                        rowData.push(addRowNum(0, i, ts.p.page, ts.p.rowNum))
                    }
                    if (gi) {
                        rowData.push(addMulti(idr, ni, i, selr))
                    }
                    if (si) {
                        rowData.push(addSubGridCell.call(self, gi + ni, i + rcnt))
                    }
                    rowReader = objectReader;
                    if (dReader.repeatitems) {
                        if (dReader.cell) {
                            cur = $.jgrid.getAccessor(cur, dReader.cell) || cur
                        }
                        if ($.isArray(cur)) {
                            rowReader = arrayReader
                        }
                    }
                    for (j = 0; j < rowReader.length; j++) {
                        v = $.jgrid.getAccessor(cur, rowReader[j]);
                        rd[ts.p.colModel[j + gi + si + ni].name] = v;
                        rowData.push(addCell(idr, v, j + gi + si + ni, i + rcnt, cur, rd))
                    }
                    rowData[iStartTrTag] = constructTr(idr, hiderow, cn1, rd, cur, selr);
                    rowData.push("</tr>");
                    if (ts.p.grouping) {
                        grpdata.push(rowData);
                        if (!ts.p.groupingView._locgr) {
                            groupingPrepare.call(self, rd, i)
                        }
                        rowData = []
                    }
                    if (locdata || ts.p.treeGrid === true) {
                        rd[locid] = $.jgrid.stripPref(ts.p.idPrefix, idr);
                        ts.p.data.push(rd);
                        ts.p._index[rd[locid]] = ts.p.data.length - 1
                    }
                    if (ts.p.gridview === false) {
                        $("#" + $.jgrid.jqID(ts.p.id) + " tbody:first").append(rowData.join(""));
                        self.triggerHandler("jqGridAfterInsertRow", [idr, rd, cur]);
                        if (afterInsRow) {
                            ts.p.afterInsertRow.call(ts, idr, rd, cur)
                        }
                        rowData = []
                    }
                    rd = {};
                    ir++;
                    i++;
                    if (ir === rn) {
                        break
                    }
                }
                if (ts.p.gridview === true) {
                    fpos = ts.p.treeANode > -1 ? ts.p.treeANode: 0;
                    if (ts.p.grouping) {
                        if (!locdata) {
                            self.jqGrid("groupingRender", grpdata, ts.p.colModel.length, ts.p.page, rn);
                            grpdata = null
                        }
                    } else {
                        if (ts.p.treeGrid === true && fpos > 0) {
                            $(ts.rows[fpos]).after(rowData.join(""))
                        } else {
                            $("#" + $.jgrid.jqID(ts.p.id) + " tbody:first").append(rowData.join(""));
                            ts.grid.cols = ts.rows[0].cells
                        }
                    }
                }
                if (ts.p.subGrid === true) {
                    try {
                        self.jqGrid("addSubGrid", gi + ni)
                    } catch(_) {}
                }
                ts.p.totaltime = new Date() - startReq;
                if (ir > 0) {
                    if (ts.p.records === 0) {
                        ts.p.records = len
                    }
                }
                rowData = null;
                if (ts.p.treeGrid === true) {
                    try {
                        self.jqGrid("setTreeNode", fpos + 1, ir + fpos + 1)
                    } catch(e) {}
                }
                ts.p.reccount = ir;
                ts.p.treeANode = -1;
                if (ts.p.userDataOnFooter) {
                    self.jqGrid("footerData", "set", ts.p.userData, true)
                }
                if (locdata) {
                    ts.p.records = len;
                    ts.p.lastpage = Math.ceil(len / rn)
                }
                if (!more) {
                    ts.updatepager(false, true)
                }
                if (locdata) {
                    while (ir < len && drows[ir]) {
                        cur = drows[ir];
                        idr = $.jgrid.getAccessor(cur, idn);
                        if (idr === undefined) {
                            if (typeof idn === "number" && ts.p.colModel[idn + gi + si + ni] != null) {
                                idr = $.jgrid.getAccessor(cur, ts.p.colModel[idn + gi + si + ni].name)
                            }
                            if (idr === undefined) {
                                idr = br + ir;
                                if (f.length === 0) {
                                    if (dReader.cell) {
                                        var ccur2 = $.jgrid.getAccessor(cur, dReader.cell) || cur;
                                        idr = ccur2 != null && ccur2[idn] !== undefined ? ccur2[idn] : idr;
                                        ccur2 = null
                                    }
                                }
                            }
                        }
                        if (cur) {
                            idr = ts.p.idPrefix + idr;
                            rowReader = objectReader;
                            if (dReader.repeatitems) {
                                if (dReader.cell) {
                                    cur = $.jgrid.getAccessor(cur, dReader.cell) || cur
                                }
                                if ($.isArray(cur)) {
                                    rowReader = arrayReader
                                }
                            }
                            for (j = 0; j < rowReader.length; j++) {
                                rd[ts.p.colModel[j + gi + si + ni].name] = $.jgrid.getAccessor(cur, rowReader[j])
                            }
                            rd[locid] = $.jgrid.stripPref(ts.p.idPrefix, idr);
                            if (ts.p.grouping) {
                                groupingPrepare.call(self, rd, ir)
                            }
                            ts.p.data.push(rd);
                            ts.p._index[rd[locid]] = ts.p.data.length - 1;
                            rd = {}
                        }
                        ir++
                    }
                    if (ts.p.grouping) {
                        ts.p.groupingView._locgr = true;
                        self.jqGrid("groupingRender", grpdata, ts.p.colModel.length, ts.p.page, rn);
                        grpdata = null
                    }
                }
            },
            addLocalData = function() {
                var st = ts.p.multiSort ? [] : "",
                sto = [],
                fndsort = false,
                cmtypes = {},
                grtypes = [],
                grindexes = [],
                srcformat,
                sorttype,
                newformat;
                if (!$.isArray(ts.p.data)) {
                    return
                }
                var grpview = ts.p.grouping ? ts.p.groupingView: false,
                lengrp,
                gin;
                $.each(ts.p.colModel,
                function() {
                    sorttype = this.sorttype || "text";
                    if (sorttype === "date" || sorttype === "datetime") {
                        if (this.formatter && typeof this.formatter === "string" && this.formatter === "date") {
                            if (this.formatoptions && this.formatoptions.srcformat) {
                                srcformat = this.formatoptions.srcformat
                            } else {
                                srcformat = $.jgrid.formatter.date.srcformat
                            }
                            if (this.formatoptions && this.formatoptions.newformat) {
                                newformat = this.formatoptions.newformat
                            } else {
                                newformat = $.jgrid.formatter.date.newformat
                            }
                        } else {
                            srcformat = newformat = this.datefmt || "Y-m-d"
                        }
                        cmtypes[this.name] = {
                            stype: sorttype,
                            srcfmt: srcformat,
                            newfmt: newformat,
                            sfunc: this.sortfunc || null
                        }
                    } else {
                        cmtypes[this.name] = {
                            stype: sorttype,
                            srcfmt: "",
                            newfmt: "",
                            sfunc: this.sortfunc || null
                        }
                    }
                    if (ts.p.grouping) {
                        for (gin = 0, lengrp = grpview.groupField.length; gin < lengrp; gin++) {
                            if (this.name === grpview.groupField[gin]) {
                                var grindex = this.name;
                                if (this.index) {
                                    grindex = this.index
                                }
                                grtypes[gin] = cmtypes[grindex];
                                grindexes[gin] = grindex
                            }
                        }
                    }
                    if (ts.p.multiSort) {
                        if (this.lso) {
                            st.push(this.name);
                            var tmplso = this.lso.split("-");
                            sto.push(tmplso[tmplso.length - 1])
                        }
                    } else {
                        if (!fndsort && (this.index === ts.p.sortname || this.name === ts.p.sortname)) {
                            st = this.name;
                            fndsort = true
                        }
                    }
                });
                if (ts.p.treeGrid && cmtypes[st]) {
                    $(ts).jqGrid("SortTree", st, ts.p.sortorder, cmtypes[st].stype || "text", cmtypes[st].srcfmt || "");
                    return
                }
                var compareFnMap = {
                    eq: function(queryObj) {
                        return queryObj.equals
                    },
                    ne: function(queryObj) {
                        return queryObj.notEquals
                    },
                    lt: function(queryObj) {
                        return queryObj.less
                    },
                    le: function(queryObj) {
                        return queryObj.lessOrEquals
                    },
                    gt: function(queryObj) {
                        return queryObj.greater
                    },
                    ge: function(queryObj) {
                        return queryObj.greaterOrEquals
                    },
                    cn: function(queryObj) {
                        return queryObj.contains
                    },
                    nc: function(queryObj, op) {
                        return op === "OR" ? queryObj.orNot().contains: queryObj.andNot().contains
                    },
                    bw: function(queryObj) {
                        return queryObj.startsWith
                    },
                    bn: function(queryObj, op) {
                        return op === "OR" ? queryObj.orNot().startsWith: queryObj.andNot().startsWith
                    },
                    en: function(queryObj, op) {
                        return op === "OR" ? queryObj.orNot().endsWith: queryObj.andNot().endsWith
                    },
                    ew: function(queryObj) {
                        return queryObj.endsWith
                    },
                    ni: function(queryObj, op) {
                        return op === "OR" ? queryObj.orNot().equals: queryObj.andNot().equals
                    },
                    "in": function(queryObj) {
                        return queryObj.equals
                    },
                    nu: function(queryObj) {
                        return queryObj.isNull
                    },
                    nn: function(queryObj, op) {
                        return op === "OR" ? queryObj.orNot().isNull: queryObj.andNot().isNull
                    }
                },
                query = $.jgrid.from(ts.p.data);
                if (ts.p.ignoreCase) {
                    query = query.ignoreCase()
                }
                function tojLinq(group) {
                    var s = 0,
                    index, gor, ror, opr, rule;
                    if (group.groups != null) {
                        gor = group.groups.length && group.groupOp.toString().toUpperCase() === "OR";
                        if (gor) {
                            query.orBegin()
                        }
                        for (index = 0; index < group.groups.length; index++) {
                            if (s > 0 && gor) {
                                query.or()
                            }
                            try {
                                tojLinq(group.groups[index])
                            } catch(e) {
                                alert(e)
                            }
                            s++
                        }
                        if (gor) {
                            query.orEnd()
                        }
                    }
                    if (group.rules != null) {
                        try {
                            ror = group.rules.length && group.groupOp.toString().toUpperCase() === "OR";
                            if (ror) {
                                query.orBegin()
                            }
                            for (index = 0; index < group.rules.length; index++) {
                                rule = group.rules[index];
                                opr = group.groupOp.toString().toUpperCase();
                                if (compareFnMap[rule.op] && rule.field) {
                                    if (s > 0 && opr && opr === "OR") {
                                        query = query.or()
                                    }
                                    query = compareFnMap[rule.op](query, opr)(rule.field, rule.data, cmtypes[rule.field])
                                }
                                s++
                            }
                            if (ror) {
                                query.orEnd()
                            }
                        } catch(g) {
                            alert(g)
                        }
                    }
                }
                if (ts.p.search === true) {
                    var srules = ts.p.postData.filters;
                    if (srules) {
                        if (typeof srules === "string") {
                            srules = $.jgrid.parse(srules)
                        }
                        tojLinq(srules)
                    } else {
                        try {
                            query = compareFnMap[ts.p.postData.searchOper](query)(ts.p.postData.searchField, ts.p.postData.searchString, cmtypes[ts.p.postData.searchField])
                        } catch(se) {}
                    }
                }
                if (ts.p.grouping) {
                    for (gin = 0; gin < lengrp; gin++) {
                        query.orderBy(grindexes[gin], grpview.groupOrder[gin], grtypes[gin].stype, grtypes[gin].srcfmt)
                    }
                }
                if (ts.p.multiSort) {
                    $.each(st,
                    function(i) {
                        query.orderBy(this, sto[i], cmtypes[this].stype, cmtypes[this].srcfmt, cmtypes[this].sfunc)
                    })
                } else {
                    if (st && ts.p.sortorder && fndsort) {
                        if (ts.p.sortorder.toUpperCase() === "DESC") {
                            query.orderBy(ts.p.sortname, "d", cmtypes[st].stype, cmtypes[st].srcfmt, cmtypes[st].sfunc)
                        } else {
                            query.orderBy(ts.p.sortname, "a", cmtypes[st].stype, cmtypes[st].srcfmt, cmtypes[st].sfunc)
                        }
                    }
                }
                if(ts.p.reader != undefined){
                    ts.p.page = ts.p.reader.page;
                    ts.p.pageSize = ts.p.reader.pageSize;
                    ts.p.rowNum = ts.p.reader.pageSize;
                }
                var queryResults = query.select(),
                recordsperpage = parseInt(ts.p.rowNum, 10),
                total = queryResults.length,
                page = parseInt(ts.p.page, 10),
                pageSize =  ts.p.pageSize;
                totalpages = Math.ceil(total / recordsperpage),
                retresult = {};
                if ((ts.p.search || ts.p.resetsearch) && ts.p.grouping && ts.p.groupingView._locgr) {
                    ts.p.groupingView.groups = [];
                    var j, grPrepare = $.jgrid.getMethod("groupingPrepare"),
                    key,
                    udc;
                    if (ts.p.footerrow && ts.p.userDataOnFooter) {
                        for (key in ts.p.userData) {
                            if (ts.p.userData.hasOwnProperty(key)) {
                                ts.p.userData[key] = 0
                            }
                        }
                        udc = true
                    }
                    for (j = 0; j < total; j++) {
                        if (udc) {
                            for (key in ts.p.userData) {
                                ts.p.userData[key] += parseFloat(queryResults[j][key] || 0)
                            }
                        }
                        grPrepare.call($(ts), queryResults[j], j, recordsperpage)
                    }
                }
                queryResults = queryResults.slice((page - 1) * recordsperpage, page * recordsperpage);
                query = null;
                cmtypes = null;
                retresult[ts.p.localReader.total] = totalpages;
                retresult[ts.p.localReader.page] = page;
                retresult[ts.p.localReader.pageSize] = pageSize;
                retresult[ts.p.localReader.records] = total;
                retresult[ts.p.localReader.root] = queryResults;
                retresult[ts.p.localReader.userdata] = ts.p.userData;
                queryResults = null;
                return retresult
            },
            updatepager = function(rn, dnd) {
                var cp, last, base, from, to, tot, fmt, pgboxes = "",
                sppg, tspg = ts.p.pager ? "_" + $.jgrid.jqID(ts.p.pager.substr(1)) : "",
                tspg_t = ts.p.toppager ? "_" + ts.p.toppager.substr(1) : "";
                base = parseInt(ts.p.page, 10) - 1;
                if (base < 0) {
                    base = 0
                }
                base = base * parseInt(ts.p.rowNum, 10);
                to = base + ts.p.reccount;
                if (ts.p.scroll) {
                    var rows = $("tbody:first > tr:gt(0)", ts.grid.bDiv);
                    base = to - rows.length;
                    ts.p.reccount = rows.length;
                    var rh = rows.outerHeight() || ts.grid.prevRowHeight;
                    if (rh) {
                        var top = base * rh;
                        var height = parseInt(ts.p.records, 10) * rh;
                        $(">div:first", ts.grid.bDiv).css({
                            height: height
                        }).children("div:first").css({
                            height: top,
                            display: top ? "": "none"
                        });
                        if (ts.grid.bDiv.scrollTop == 0 && ts.p.page > 1) {
                            ts.grid.bDiv.scrollTop = ts.p.rowNum * (ts.p.page - 1) * rh
                        }
                    }
                    ts.grid.bDiv.scrollLeft = ts.grid.hDiv.scrollLeft
                }
                pgboxes = ts.p.pager || "";
                pgboxes += ts.p.toppager ? (pgboxes ? "," + ts.p.toppager: ts.p.toppager) : "";
                if (pgboxes) {
                    fmt = $.jgrid.formatter.integer || {};
                    cp = intNum(ts.p.page);
                    last = intNum(ts.p.lastpage);
                    $(".selbox", pgboxes)[this.p.useProp ? "prop": "attr"]("disabled", false);
                    if (ts.p.pginput === true) {
                        $(".ui-pg-input", pgboxes).val(ts.p.page);
                        sppg = ts.p.toppager ? "#sp_1" + tspg + ",#sp_1" + tspg_t: "#sp_1" + tspg;
                        $(sppg).html($.fmatter ? $.fmatter.util.NumberFormat(ts.p.lastpage, fmt) : ts.p.lastpage)
                    }
                    if (ts.p.viewrecords) {
                        if (ts.p.reccount === 0) {
                            $(".ui-paging-info", pgboxes).html(ts.p.emptyrecords)
                        } else {
                            from = base + 1;
                            tot = ts.p.records;
                            if ($.fmatter) {
                                from = $.fmatter.util.NumberFormat(from, fmt);
                                to = $.fmatter.util.NumberFormat(to, fmt);
                                tot = $.fmatter.util.NumberFormat(tot, fmt)
                            }
                            $(".ui-paging-info", pgboxes).html($.jgrid.format(ts.p.recordtext, from, to, tot))
                        }
                    }
                    if (ts.p.pgbuttons === true) {
                        if (cp <= 0) {
                            cp = last = 0
                        }
                        if (cp === 1 || cp === 0) {
                            $("#first" + tspg + ", #prev" + tspg).addClass("ui-state-disabled").removeClass("ui-state-hover");
                            if (ts.p.toppager) {
                                $("#first_t" + tspg_t + ", #prev_t" + tspg_t).addClass("ui-state-disabled").removeClass("ui-state-hover")
                            }
                        } else {
                            $("#first" + tspg + ", #prev" + tspg).removeClass("ui-state-disabled");
                            if (ts.p.toppager) {
                                $("#first_t" + tspg_t + ", #prev_t" + tspg_t).removeClass("ui-state-disabled")
                            }
                        }
                        if (cp === last || cp === 0) {
                            $("#next" + tspg + ", #last" + tspg).addClass("ui-state-disabled").removeClass("ui-state-hover");
                            if (ts.p.toppager) {
                                $("#next_t" + tspg_t + ", #last_t" + tspg_t).addClass("ui-state-disabled").removeClass("ui-state-hover")
                            }
                        } else {
                            $("#next" + tspg + ", #last" + tspg).removeClass("ui-state-disabled");
                            if (ts.p.toppager) {
                                $("#next_t" + tspg_t + ", #last_t" + tspg_t).removeClass("ui-state-disabled")
                            }
                        }
                    }
                }
                if (rn === true && ts.p.rownumbers === true) {
                    $(">td.jqgrid-rownum", ts.rows).each(function(i) {
                        $(this).html(base + 1 + i)
                    })
                }
                if (dnd && ts.p.jqgdnd) {
                    $(ts).jqGrid("gridDnD", "updateDnD")
                }
                $(ts).triggerHandler("jqGridGridComplete");
                if ($.isFunction(ts.p.gridComplete)) {
                    ts.p.gridComplete.call(ts)
                }
                $(ts).triggerHandler("jqGridAfterGridComplete")
            },
            beginReq = function() {
                ts.grid.hDiv.loading = true;
                if (ts.p.hiddengrid) {
                    return
                }
                $(ts).jqGrid("progressBar", {
                    method: "show",
                    loadtype: ts.p.loadui,
                    htmlcontent: ts.p.loadtext
                })
            },
            endReq = function() {
                ts.grid.hDiv.loading = false;
                $(ts).jqGrid("progressBar", {
                    method: "hide",
                    loadtype: ts.p.loadui
                })
            },
            populate = function(npage) {
                if (!ts.grid.hDiv.loading) {
                    var pvis = ts.p.scroll && npage === false,
                    prm = {},
                    dt, dstr, pN = ts.p.prmNames;
                    if (ts.p.page <= 0) {
                        ts.p.page = Math.min(1, ts.p.lastpage)
                    }
                    if (pN.search !== null) {
                        prm[pN.search] = ts.p.search
                    }
                    if (pN.nd !== null) {
                        prm[pN.nd] = new Date().getTime()
                    }
                    if (pN.rows !== null) {
                        prm[pN.rows] = ts.p.rowNum
                    }
                    if (pN.page !== null) {
                        prm[pN.page] = ts.p.page
                    }
                    if (pN.sort !== null) {
                        prm[pN.sort] = ts.p.sortname
                    }
                    if (pN.order !== null) {
                        prm[pN.order] = ts.p.sortorder
                    }
                    if (ts.p.rowTotal !== null && pN.totalrows !== null) {
                        prm[pN.totalrows] = ts.p.rowTotal
                    }
                    var lcf = $.isFunction(ts.p.loadComplete),
                    lc = lcf ? ts.p.loadComplete: null;
                    var adjust = 0;
                    npage = npage || 1;
                    if (npage > 1) {
                        if (pN.npage !== null) {
                            prm[pN.npage] = npage;
                            adjust = npage - 1;
                            npage = 1
                        } else {
                            lc = function(req) {
                                ts.p.page++;
                                ts.grid.hDiv.loading = false;
                                if (lcf) {
                                    ts.p.loadComplete.call(ts, req)
                                }
                                populate(npage - 1)
                            }
                        }
                    } else {
                        if (pN.npage !== null) {
                            delete ts.p.postData[pN.npage]
                        }
                    }
                    if (ts.p.grouping) {
                        $(ts).jqGrid("groupingSetup");
                        var grp = ts.p.groupingView,
                        gi, gs = "";
                        for (gi = 0; gi < grp.groupField.length; gi++) {
                            var index = grp.groupField[gi];
                            $.each(ts.p.colModel,
                            function(cmIndex, cmValue) {
                                if (cmValue.name === index && cmValue.index) {
                                    index = cmValue.index
                                }
                            });
                            gs += index + " " + grp.groupOrder[gi] + ", "
                        }
                        prm[pN.sort] = gs + prm[pN.sort]
                    }
                    $.extend(ts.p.postData, prm);
                    var rcnt = !ts.p.scroll ? 1 : ts.rows.length - 1;
                    var bfr = $(ts).triggerHandler("jqGridBeforeRequest");
                    if (bfr === false || bfr === "stop") {
                        return
                    }
                    if ($.isFunction(ts.p.datatype)) {
                        ts.p.datatype.call(ts, ts.p.postData, "load_" + ts.p.id, rcnt, npage, adjust);
                        return
                    }
                    if ($.isFunction(ts.p.beforeRequest)) {
                        bfr = ts.p.beforeRequest.call(ts);
                        if (bfr === undefined) {
                            bfr = true
                        }
                        if (bfr === false) {
                            return
                        }
                    }
                    dt = ts.p.datatype.toLowerCase();
                    switch (dt) {
                    case "json":
                    case "jsonp":
                    case "xml":
                    case "script":
                        $.ajax($.extend({
                            url:
                            ts.p.url,
                            type: ts.p.mtype,
                            dataType: dt,
                            data: $.isFunction(ts.p.serializeGridData) ? ts.p.serializeGridData.call(ts, ts.p.postData) : ts.p.postData,
                            success: function(data, st, xhr) {
                                if ($.isFunction(ts.p.beforeProcessing)) {
                                    if (ts.p.beforeProcessing.call(ts, data, st, xhr) === false) {
                                        endReq();
                                        return
                                    }
                                }
                                if (dt === "xml") {
                                    addXmlData(data, ts.grid.bDiv, rcnt, npage > 1, adjust)
                                } else {
                                    addJSONData(data, ts.grid.bDiv, rcnt, npage > 1, adjust)
                                }
                                $(ts).triggerHandler("jqGridLoadComplete", [data]);
                                if (lc) {
                                    lc.call(ts, data)
                                }
                                $(ts).triggerHandler("jqGridAfterLoadComplete", [data]);
                                if (pvis) {
                                    ts.grid.populateVisible()
                                }
                                if (ts.p.loadonce || ts.p.treeGrid) {
                                    ts.p.datatype = "local"
                                }
                                data = null;
                                if (npage === 1) {
                                    endReq()
                                }
                            },
                            error: function(xhr, st, err) {
                                if ($.isFunction(ts.p.loadError)) {
                                    ts.p.loadError.call(ts, xhr, st, err)
                                }
                                if (npage === 1) {
                                    endReq()
                                }
                                xhr = null
                            },
                            beforeSend: function(xhr, settings) {
                                var gotoreq = true;
                                if ($.isFunction(ts.p.loadBeforeSend)) {
                                    gotoreq = ts.p.loadBeforeSend.call(ts, xhr, settings)
                                }
                                if (gotoreq === undefined) {
                                    gotoreq = true
                                }
                                if (gotoreq === false) {
                                    return false
                                }
                                beginReq()
                            }
                        },
                        $.jgrid.ajaxOptions, ts.p.ajaxGridOptions));
                        break;
                    case "deviceone":
                        var gotoreq = true;
                        if ($.isFunction(ts.p.loadBeforeSend)) {
                            gotoreq = ts.p.loadBeforeSend.call(ts, xhr, settings)
                        }
                        if (gotoreq === undefined) {
                            gotoreq = true
                        }
                        if (gotoreq === false) {
                            return false
                        }
                        beginReq();
                        if (!ts.p.deviceoneHttp) {
                            ts.p.deviceoneHttp = deviceone.mm("do_Http")
                        }
                        var http = ts.p.deviceoneHttp;
                        http.method = "post";
                        http.timeout = 60000;
                        http.contentType = "application/json";
                        var dataArr = ts.p.postData,
                        dataStr = "";
                        for (var i = 0; i < dataArr.length; i++) {
                            dataStr += "&" + dataArr[i]["name"] + "=" + dataArr[i]["value"]
                        }
                        http.url = ts.p.url + dataStr;
                        var flag = true;
                        http.on("success",
                        function(data) {
                            if (!flag) {
                                return
                            }
                            if ($.isFunction(ts.p.beforeProcessing)) {
                                if (ts.p.beforeProcessing.call(ts, data, st, xhr) === false) {
                                    endReq();
                                    return
                                }
                            }
                            if (dt === "xml") {
                                addXmlData(data, ts.grid.bDiv, rcnt, npage > 1, adjust)
                            } else {
                                addJSONData(data, ts.grid.bDiv, rcnt, npage > 1, adjust)
                            }
                            $(ts).triggerHandler("jqGridLoadComplete", [data]);
                            if (lc) {
                                lc.call(ts, data)
                            }
                            $(ts).triggerHandler("jqGridAfterLoadComplete", [data]);
                            if (pvis) {
                                ts.grid.populateVisible()
                            }
                            if (ts.p.loadonce || ts.p.treeGrid) {
                                ts.p.datatype = "local"
                            }
                            data = null;
                            if (npage === 1) {
                                endReq()
                            }
                            flag = false
                        });
                        http.on("fail",
                        function(data) {
                            if ($.isFunction(ts.p.loadError)) {
                                ts.p.loadError.call(ts, data, data, data)
                            }
                            if (npage === 1) {
                                endReq()
                            }
                            xhr = null
                        });
                        http.request();
                        break;
                    case "xmlstring":
                        beginReq();
                        dstr = typeof ts.p.datastr !== "string" ? ts.p.datastr: $.parseXML(ts.p.datastr);
                        addXmlData(dstr, ts.grid.bDiv);
                        $(ts).triggerHandler("jqGridLoadComplete", [dstr]);
                        if (lcf) {
                            ts.p.loadComplete.call(ts, dstr)
                        }
                        $(ts).triggerHandler("jqGridAfterLoadComplete", [dstr]);
                        ts.p.datatype = "local";
                        ts.p.datastr = null;
                        endReq();
                        break;
                    case "jsonstring":
                        beginReq();
                        if (typeof ts.p.datastr === "string") {
                            dstr = $.jgrid.parse(ts.p.datastr)
                        } else {
                            dstr = ts.p.datastr
                        }
                        addJSONData(dstr, ts.grid.bDiv);
                        $(ts).triggerHandler("jqGridLoadComplete", [dstr]);
                        if (lcf) {
                            ts.p.loadComplete.call(ts, dstr)
                        }
                        $(ts).triggerHandler("jqGridAfterLoadComplete", [dstr]);
                        ts.p.datatype = "local";
                        ts.p.datastr = null;
                        endReq();
                        break;
                    case "local":
                    case "clientside":
                        beginReq();
                        ts.p.datatype = "local";
                        var req = addLocalData();
                        addJSONData(req, ts.grid.bDiv, rcnt, npage > 1, adjust);
                        $(ts).triggerHandler("jqGridLoadComplete", [req]);
                        if (lc) {
                            lc.call(ts, req)
                        }
                        $(ts).triggerHandler("jqGridAfterLoadComplete", [req]);
                        if (pvis) {
                            ts.grid.populateVisible()
                        }
                        endReq();
                        break
                    }
                }
            },
            setHeadCheckBox = function(checked) {
                $("#cb_" + $.jgrid.jqID(ts.p.id), ts.grid.hDiv)[ts.p.useProp ? "prop": "attr"]("checked", checked);
                var fid = ts.p.frozenColumns ? ts.p.id + "_frozen": "";
                if (fid) {
                    $("#cb_" + $.jgrid.jqID(ts.p.id), ts.grid.fhDiv)[ts.p.useProp ? "prop": "attr"]("checked", checked)
                }
            },
            setPager = function(pgid, tp) {
                var sep = "<td class='ui-pg-button ui-state-disabled' style='width:4px;'><span class='ui-separator'></span></td>",
                pginp = "",
                pgl = "<table cellspacing='0' cellpadding='0' border='0' style='table-layout:auto;' class='ui-pg-table'><tbody><tr>",
                str = "",
                pgcnt, lft, cent, rgt, twd, tdw, i, clearVals = function(onpaging) {
                    var ret;
                    if ($.isFunction(ts.p.onPaging)) {
                        ret = ts.p.onPaging.call(ts, onpaging)
                    }
                    if (ret === "stop") {
                        return false
                    }
                    ts.p.selrow = null;
                    if (ts.p.multiselect) {
                        ts.p.selarrrow = [];
                        setHeadCheckBox(false)
                    }
                    ts.p.savedRow = [];
                    return true
                };
                pgid = pgid.substr(1);
                tp += "_" + pgid;
                pgcnt = "pg_" + pgid;
                lft = pgid + "_left";
                cent = pgid + "_center";
                rgt = pgid + "_right";
                $("#" + $.jgrid.jqID(pgid)).append("<div id='" + pgcnt + "' class='ui-pager-control' role='group'><table cellspacing='0' cellpadding='0' border='0' class='ui-pg-table' style='width:100%;table-layout:fixed;height:100%;' role='row'><tbody><tr><td id='" + lft + "' align='left'></td><td id='" + cent + "' align='center' style='white-space:pre;'></td><td id='" + rgt + "' align='right'></td></tr></tbody></table></div>").attr("dir", "ltr");
                if (ts.p.rowList.length > 0) {
                    str = "<td dir='" + dir + "'>";
                    str += "<select class='ui-pg-selbox' role='listbox' " + (ts.p.pgrecs ? "title='" + ts.p.pgrecs + "'": "") + ">";
                    var strnm;
                    for (i = 0; i < ts.p.rowList.length; i++) {
                        strnm = ts.p.rowList[i].toString().split(":");
                        if (strnm.length === 1) {
                            strnm[1] = strnm[0]
                        }
                        str += '<option role="option" value="' + strnm[0] + '"' + ((intNum(ts.p.rowNum, 0) === intNum(strnm[0], 0)) ? ' selected="selected"': "") + ">" + strnm[1] + "</option>"
                    }
                    str += "</select></td>"
                }
                if (dir === "rtl") {
                    pgl += str
                }
                if (ts.p.pginput === true) {
                    pginp = "<td dir='" + dir + "'>" + $.jgrid.format(ts.p.pgtext || "", "<input class='ui-pg-input' type='text' size='2' maxlength='7' value='0' role='textbox'/>", "<span id='sp_1_" + $.jgrid.jqID(pgid) + "'></span>") + "</td>"
                }
                if (ts.p.pgbuttons === true) {
                    var po = ["first" + tp, "prev" + tp, "next" + tp, "last" + tp];
                    if (dir === "rtl") {
                        po.reverse()
                    }
                    pgl += "<td id='" + po[0] + "' class='ui-pg-button ui-corner-all' " + (ts.p.pgfirst ? "title='" + ts.p.pgfirst + "'": "") + "><span class='ui-icon ui-icon-seek-first'></span></td>";
                    pgl += "<td id='" + po[1] + "' class='ui-pg-button ui-corner-all' " + (ts.p.pgprev ? "title='" + ts.p.pgprev + "'": "") + "><span class='ui-icon ui-icon-seek-prev'></span></td>";
                    pgl += pginp !== "" ? sep + pginp + sep: "";
                    pgl += "<td id='" + po[2] + "' class='ui-pg-button ui-corner-all' " + (ts.p.pgnext ? "title='" + ts.p.pgnext + "'": "") + "><span class='ui-icon ui-icon-seek-next'></span></td>";
                    pgl += "<td id='" + po[3] + "' class='ui-pg-button ui-corner-all' " + (ts.p.pglast ? "title='" + ts.p.pglast + "'": "") + "><span class='ui-icon ui-icon-seek-end'></span></td>"
                } else {
                    if (pginp !== "") {
                        pgl += pginp
                    }
                }
                if (dir === "ltr") {
                    pgl += str
                }
                pgl += "</tr></tbody></table>";
                if (ts.p.viewrecords === true) {
                    $("td#" + pgid + "_" + ts.p.recordpos, "#" + pgcnt).append("<div dir='" + dir + "' style='text-align:" + ts.p.recordpos + "' class='ui-paging-info'></div>")
                }
                $("td#" + pgid + "_" + ts.p.pagerpos, "#" + pgcnt).append(pgl);
                tdw = $(".ui-jqgrid").css("font-size") || "11px";
                $(document.body).append("<div id='testpg' class='ui-jqgrid ui-widget ui-widget-content' style='font-size:" + tdw + ";visibility:hidden;' ></div>");
                twd = $(pgl).clone().appendTo("#testpg").width();
                $("#testpg").remove();
                if (twd > 0) {
                    if (pginp !== "") {
                        twd += 50
                    }
                    $("td#" + pgid + "_" + ts.p.pagerpos, "#" + pgcnt).width(twd)
                }
                ts.p._nvtd = [];
                ts.p._nvtd[0] = twd ? Math.floor((ts.p.width - twd) / 2) : Math.floor(ts.p.width / 3);
                ts.p._nvtd[1] = 0;
                pgl = null;
                $(".ui-pg-selbox", "#" + pgcnt).bind("change",
                function() {
                    if (!clearVals("records")) {
                        return false
                    }
                    ts.p.page = Math.round(ts.p.rowNum * (ts.p.page - 1) / this.value - 0.5) + 1;
                    ts.p.rowNum = this.value;
                    if (ts.p.pager) {
                        $(".ui-pg-selbox", ts.p.pager).val(this.value)
                    }
                    if (ts.p.toppager) {
                        $(".ui-pg-selbox", ts.p.toppager).val(this.value)
                    }
                    populate();
                    return false
                });
                if (ts.p.pgbuttons === true) {
                    $(".ui-pg-button", "#" + pgcnt).hover(function() {
                        if ($(this).hasClass("ui-state-disabled")) {
                            this.style.cursor = "default"
                        } else {
                            $(this).addClass("ui-state-hover");
                            this.style.cursor = "pointer"
                        }
                    },
                    function() {
                        if (!$(this).hasClass("ui-state-disabled")) {
                            $(this).removeClass("ui-state-hover");
                            this.style.cursor = "default"
                        }
                    });
                    $("#first" + $.jgrid.jqID(tp) + ", #prev" + $.jgrid.jqID(tp) + ", #next" + $.jgrid.jqID(tp) + ", #last" + $.jgrid.jqID(tp)).click(function() {
                        if ($(this).hasClass("ui-state-disabled")) {
                            return false
                        }
                        var cp = intNum(ts.p.page, 1),
                        last = intNum(ts.p.lastpage, 1),
                        selclick = false,
                        fp = true,
                        pp = true,
                        np = true,
                        lp = true;
                        if (last === 0 || last === 1) {
                            fp = false;
                            pp = false;
                            np = false;
                            lp = false
                        } else {
                            if (last > 1 && cp >= 1) {
                                if (cp === 1) {
                                    fp = false;
                                    pp = false
                                } else {
                                    if (cp === last) {
                                        np = false;
                                        lp = false
                                    }
                                }
                            } else {
                                if (last > 1 && cp === 0) {
                                    np = false;
                                    lp = false;
                                    cp = last - 1
                                }
                            }
                        }
                        if (!clearVals(this.id)) {
                            return false
                        }
                        if (this.id === "first" + tp && fp) {
                            ts.p.page = 1;
                            selclick = true
                        }
                        if (this.id === "prev" + tp && pp) {
                            ts.p.page = (cp - 1);
                            selclick = true
                        }
                        if (this.id === "next" + tp && np) {
                            ts.p.page = (cp + 1);
                            selclick = true
                        }
                        if (this.id === "last" + tp && lp) {
                            ts.p.page = last;
                            selclick = true
                        }
                        if (selclick) {
                            populate()
                        }
                        return false
                    })
                }
                if (ts.p.pginput === true) {
                    $("input.ui-pg-input", "#" + pgcnt).keypress(function(e) {
                        var key = e.charCode || e.keyCode || 0;
                        if (key === 13) {
                            if (!clearVals("user")) {
                                return false
                            }
                            $(this).val(intNum($(this).val(), 1));
                            ts.p.page = ($(this).val() > 0) ? $(this).val() : ts.p.page;
                            populate();
                            return false
                        }
                        return this
                    })
                }
            },
            multiSort = function(iCol, obj) {
                var splas, sort = "",
                cm = ts.p.colModel,
                fs = false,
                ls, selTh = ts.p.frozenColumns ? obj: ts.grid.headers[iCol].el,
                so = "";
                $("span.ui-grid-ico-sort", selTh).addClass("ui-state-disabled");
                $(selTh).attr("aria-selected", "false");
                if (cm[iCol].lso) {
                    if (cm[iCol].lso === "asc") {
                        cm[iCol].lso += "-desc";
                        so = "desc"
                    } else {
                        if (cm[iCol].lso === "desc") {
                            cm[iCol].lso += "-asc";
                            so = "asc"
                        } else {
                            if (cm[iCol].lso === "asc-desc" || cm[iCol].lso === "desc-asc") {
                                cm[iCol].lso = ""
                            }
                        }
                    }
                } else {
                    cm[iCol].lso = so = cm[iCol].firstsortorder || "asc"
                }
                if (so) {
                    $("span.s-ico", selTh).show();
                    $("span.ui-icon-" + so, selTh).removeClass("ui-state-disabled");
                    $(selTh).attr("aria-selected", "true")
                } else {
                    if (!ts.p.viewsortcols[0]) {
                        $("span.s-ico", selTh).hide()
                    }
                }
                ts.p.sortorder = "";
                $.each(cm,
                function(i) {
                    if (this.lso) {
                        if (i > 0 && fs) {
                            sort += ", "
                        }
                        splas = this.lso.split("-");
                        sort += cm[i].index || cm[i].name;
                        sort += " " + splas[splas.length - 1];
                        fs = true;
                        ts.p.sortorder = splas[splas.length - 1]
                    }
                });
                ls = sort.lastIndexOf(ts.p.sortorder);
                sort = sort.substring(0, ls);
                ts.p.sortname = sort
            },
            sortData = function(index, idxcol, reload, sor, obj) {
                if (!ts.p.colModel[idxcol].sortable) {
                    return
                }
                if (ts.p.savedRow.length > 0) {
                    return
                }
                if (!reload) {
                    if (ts.p.lastsort === idxcol && ts.p.sortname !== "") {
                        if (ts.p.sortorder === "asc") {
                            ts.p.sortorder = "desc"
                        } else {
                            if (ts.p.sortorder === "desc") {
                                ts.p.sortorder = "asc"
                            }
                        }
                    } else {
                        ts.p.sortorder = ts.p.colModel[idxcol].firstsortorder || "asc"
                    }
                    ts.p.page = 1
                }
                if (ts.p.multiSort) {
                    multiSort(idxcol, obj)
                } else {
                    if (sor) {
                        if (ts.p.lastsort === idxcol && ts.p.sortorder === sor && !reload) {
                            return
                        }
                        ts.p.sortorder = sor
                    }
                    var previousSelectedTh = ts.grid.headers[ts.p.lastsort].el,
                    newSelectedTh = ts.p.frozenColumns ? obj: ts.grid.headers[idxcol].el;
                    $("span.ui-grid-ico-sort", previousSelectedTh).addClass("ui-state-disabled");
                    $(previousSelectedTh).attr("aria-selected", "false");
                    if (ts.p.frozenColumns) {
                        ts.grid.fhDiv.find("span.ui-grid-ico-sort").addClass("ui-state-disabled");
                        ts.grid.fhDiv.find("th").attr("aria-selected", "false")
                    }
                    $("span.ui-icon-" + ts.p.sortorder, newSelectedTh).removeClass("ui-state-disabled");
                    $(newSelectedTh).attr("aria-selected", "true");
                    if (!ts.p.viewsortcols[0]) {
                        if (ts.p.lastsort !== idxcol) {
                            if (ts.p.frozenColumns) {
                                ts.grid.fhDiv.find("span.s-ico").hide()
                            }
                            $("span.s-ico", previousSelectedTh).hide();
                            $("span.s-ico", newSelectedTh).show()
                        } else {
                            if (ts.p.sortname === "") {
                                $("span.s-ico", newSelectedTh).show()
                            }
                        }
                    }
                    index = index.substring(5 + ts.p.id.length + 1);
                    ts.p.sortname = ts.p.colModel[idxcol].index || index
                }
                if ($(ts).triggerHandler("jqGridSortCol", [ts.p.sortname, idxcol, ts.p.sortorder]) === "stop") {
                    ts.p.lastsort = idxcol;
                    return
                }
                if ($.isFunction(ts.p.onSortCol)) {
                    if (ts.p.onSortCol.call(ts, ts.p.sortname, idxcol, ts.p.sortorder) === "stop") {
                        ts.p.lastsort = idxcol;
                        return
                    }
                }
                if (ts.p.datatype === "local") {
                    if (ts.p.deselectAfterSort) {
                        $(ts).jqGrid("resetSelection")
                    }
                } else {
                    ts.p.selrow = null;
                    if (ts.p.multiselect) {
                        setHeadCheckBox(false)
                    }
                    ts.p.selarrrow = [];
                    ts.p.savedRow = []
                }
                if (ts.p.scroll) {
                    var sscroll = ts.grid.bDiv.scrollLeft;
                    emptyRows.call(ts, true, false);
                    ts.grid.hDiv.scrollLeft = sscroll
                }
                if (ts.p.subGrid && ts.p.datatype === "local") {
                    $("td.sgexpanded", "#" + $.jgrid.jqID(ts.p.id)).each(function() {
                        $(this).trigger("click")
                    })
                }
                populate();
                ts.p.lastsort = idxcol;
                if (ts.p.sortname !== index && idxcol) {
                    ts.p.lastsort = idxcol
                }
            },
            setColWidth = function() {
                var initwidth = 0,
                brd = $.jgrid.cell_width ? 0 : intNum(ts.p.cellLayout, 0),
                vc = 0,
                lvc,
                scw = intNum(ts.p.scrollOffset, 0),
                cw,
                hs = false,
                aw,
                gw = 0,
                cr;
                $.each(ts.p.colModel,
                function() {
                    if (this.hidden === undefined) {
                        this.hidden = false
                    }
                    if (ts.p.grouping && ts.p.autowidth) {
                        var ind = $.inArray(this.name, ts.p.groupingView.groupField);
                        if (ind >= 0 && ts.p.groupingView.groupColumnShow.length > ind) {
                            this.hidden = !ts.p.groupingView.groupColumnShow[ind]
                        }
                    }
                    this.widthOrg = cw = intNum(this.width, 0);
                    if (this.hidden === false) {
                        initwidth += cw + brd;
                        if (this.fixed) {
                            gw += cw + brd
                        } else {
                            vc++
                        }
                    }
                });
                if (isNaN(ts.p.width)) {
                    ts.p.width = initwidth + ((ts.p.shrinkToFit === false && !isNaN(ts.p.height)) ? scw: 0)
                }
                grid.width = ts.p.width;
                ts.p.tblwidth = initwidth;
                if (ts.p.shrinkToFit === false && ts.p.forceFit === true) {
                    ts.p.forceFit = false
                }
                if (ts.p.shrinkToFit === true && vc > 0) {
                    aw = grid.width - brd * vc - gw;
                    if (!isNaN(ts.p.height)) {
                        aw -= scw;
                        hs = true
                    }
                    initwidth = 0;
                    $.each(ts.p.colModel,
                    function(i) {
                        if (this.hidden === false && !this.fixed) {
                            cw = Math.round(aw * this.width / (ts.p.tblwidth - brd * vc - gw));
                            this.width = cw;
                            initwidth += cw;
                            lvc = i
                        }
                    });
                    cr = 0;
                    if (hs) {
                        if (grid.width - gw - (initwidth + brd * vc) !== scw) {
                            cr = grid.width - gw - (initwidth + brd * vc) - scw
                        }
                    } else {
                        if (!hs && Math.abs(grid.width - gw - (initwidth + brd * vc)) !== 1) {
                            cr = grid.width - gw - (initwidth + brd * vc)
                        }
                    }
                    ts.p.colModel[lvc].width += cr;
                    ts.p.tblwidth = initwidth + cr + brd * vc + gw;
                    if (ts.p.tblwidth > ts.p.width) {
                        ts.p.colModel[lvc].width -= (ts.p.tblwidth - parseInt(ts.p.width, 10));
                        ts.p.tblwidth = ts.p.width
                    }
                }
            },
            nextVisible = function(iCol) {
                var ret = iCol,
                j = iCol,
                i;
                for (i = iCol + 1; i < ts.p.colModel.length; i++) {
                    if (ts.p.colModel[i].hidden !== true) {
                        j = i;
                        break
                    }
                }
                return j - ret
            },
            getOffset = function(iCol) {
                var $th = $(ts.grid.headers[iCol].el),
                ret = [$th.position().left + $th.outerWidth()];
                if (ts.p.direction === "rtl") {
                    ret[0] = ts.p.width - ret[0]
                }
                ret[0] -= ts.grid.bDiv.scrollLeft;
                ret.push($(ts.grid.hDiv).position().top);
                ret.push($(ts.grid.bDiv).offset().top - $(ts.grid.hDiv).offset().top + $(ts.grid.bDiv).height());
                return ret
            },
            getColumnHeaderIndex = function(th) {
                var i, headers = ts.grid.headers,
                ci = $.jgrid.getCellIndex(th);
                for (i = 0; i < headers.length; i++) {
                    if (th === headers[i].el) {
                        ci = i;
                        break
                    }
                }
                return ci
            },
            colTemplate;
            this.p.id = this.id;
            if ($.inArray(ts.p.multikey, sortkeys) === -1) {
                ts.p.multikey = false
            }
            ts.p.keyName = false;
            for (i = 0; i < ts.p.colModel.length; i++) {
                colTemplate = typeof ts.p.colModel[i].template === "string" ? ($.jgrid.cmTemplate != null && typeof $.jgrid.cmTemplate[ts.p.colModel[i].template] === "object" ? $.jgrid.cmTemplate[ts.p.colModel[i].template] : {}) : ts.p.colModel[i].template;
                ts.p.colModel[i] = $.extend(true, {},
                ts.p.cmTemplate, colTemplate || {},
                ts.p.colModel[i]);
                if (ts.p.keyName === false && ts.p.colModel[i].key === true) {
                    ts.p.keyName = ts.p.colModel[i].name
                }
            }
            ts.p.sortorder = ts.p.sortorder.toLowerCase();
            $.jgrid.cell_width = $.jgrid.cellWidth();
            if (ts.p.grouping === true) {
                ts.p.scroll = false;
                ts.p.treeGrid = false;
                ts.p.gridview = true
            }
            if (this.p.treeGrid === true) {
                try {
                    $(this).jqGrid("setTreeGrid")
                } catch(_) {}
                if (ts.p.datatype !== "local") {
                    ts.p.localReader = {
                        id: "_id_"
                    }
                }
            }
            if (this.p.subGrid) {
                try {
                    $(ts).jqGrid("setSubGrid")
                } catch(s) {}
            }
            if (this.p.multiselect) {
                this.p.colNames.unshift("<input role='checkbox' id='cb_" + this.p.id + "' class='cbox noselect2' type='checkbox'/>");
                this.p.colModel.unshift({
                    name: "cb",
                    width: $.jgrid.cell_width ? ts.p.multiselectWidth + ts.p.cellLayout: ts.p.multiselectWidth,
                    sortable: false,
                    resizable: false,
                    hidedlg: true,
                    search: false,
                    align: "center",
                    fixed: true
                })
            }
            if (this.p.rownumbers) {
                this.p.colNames.unshift("");
                this.p.colModel.unshift({
                    name: "rn",
                    width: ts.p.rownumWidth,
                    sortable: false,
                    resizable: false,
                    hidedlg: true,
                    search: false,
                    align: "center",
                    fixed: true
                })
            }
            ts.p.xmlReader = $.extend(true, {
                root: "rows",
                row: "row",
                page: "rows>page",
                total: "rows>total",
                records: "rows>records",
                repeatitems: true,
                cell: "cell",
                id: "[id]",
                userdata: "userdata",
                subgrid: {
                    root: "rows",
                    row: "row",
                    repeatitems: true,
                    cell: "cell"
                }
            },
            ts.p.xmlReader);
            ts.p.jsonReader = $.extend(true, {
                root: "rows",
                page: "page",
                total: "total",
                records: "records",
                repeatitems: true,
                cell: "cell",
                id: "id",
                userdata: "userdata",
                subgrid: {
                    root: "rows",
                    repeatitems: true,
                    cell: "cell"
                }
            },
            ts.p.jsonReader);
            ts.p.localReader = $.extend(true, {
                root: "rows",
                page: "page",
                pageSize: "pageSize",
                total: "total",
                records: "records",
                repeatitems: false,
                cell: "cell",
                id: "id",
                userdata: "userdata",
                subgrid: {
                    root: "rows",
                    repeatitems: true,
                    cell: "cell"
                }
            },
            ts.p.localReader);
            if (ts.p.scroll) {
                ts.p.pgbuttons = false;
                ts.p.pginput = false;
                ts.p.rowList = []
            }
            if (ts.p.data.length) {
                normalizeData();
                refreshIndex()
            }
            var thead = "<thead><tr class='ui-jqgrid-labels' role='row'>",
            tdc, idn, w, res, sort, td, ptr, tbody, imgs, iac = "",
            idc = "",
            sortarr = [],
            sortord = [],
            sotmp = [];
            if (ts.p.shrinkToFit === true && ts.p.forceFit === true) {
                for (i = ts.p.colModel.length - 1; i >= 0; i--) {
                    if (!ts.p.colModel[i].hidden) {
                        ts.p.colModel[i].resizable = false;
                        break
                    }
                }
            }
            if (ts.p.viewsortcols[1] === "horizontal") {
                iac = " ui-i-asc";
                idc = " ui-i-desc"
            }
            tdc = isMSIE ? "class='ui-th-div-ie'": "";
            imgs = "<span class='s-ico' style='display:none'><span sort='asc' class='ui-grid-ico-sort ui-icon-asc" + iac + " ui-state-disabled ui-icon ui-icon-triangle-1-n ui-sort-" + dir + "'></span>";
            imgs += "<span sort='desc' class='ui-grid-ico-sort ui-icon-desc" + idc + " ui-state-disabled ui-icon ui-icon-triangle-1-s ui-sort-" + dir + "'></span></span>";
            if (ts.p.multiSort) {
                sortarr = ts.p.sortname.split(",");
                for (i = 0; i < sortarr.length; i++) {
                    sotmp = $.trim(sortarr[i]).split(" ");
                    sortarr[i] = $.trim(sotmp[0]);
                    sortord[i] = sotmp[1] ? $.trim(sotmp[1]) : ts.p.sortorder || "asc"
                }
            }
            for (i = 0; i < this.p.colNames.length; i++) {
                var tooltip = ts.p.headertitles ? (' title="' + $.jgrid.stripHtml(ts.p.colNames[i]) + '"') : "";
                thead += "<th id='" + ts.p.id + "_" + ts.p.colModel[i].name + "' role='columnheader' class='ui-state-default ui-th-column ui-th-" + dir + " " + (ts.p.colModel[i].classes || "") + "'" + tooltip + ">";
                idn = ts.p.colModel[i].index || ts.p.colModel[i].name;
                thead += "<div id='jqgh_" + ts.p.id + "_" + ts.p.colModel[i].name + "' " + tdc + ">" + ts.p.colNames[i];
                if (!ts.p.colModel[i].width) {
                    ts.p.colModel[i].width = 150
                } else {
                    ts.p.colModel[i].width = parseInt(ts.p.colModel[i].width, 10)
                }
                if (typeof ts.p.colModel[i].title !== "boolean") {
                    ts.p.colModel[i].title = true
                }
                ts.p.colModel[i].lso = "";
                if (idn === ts.p.sortname) {
                    ts.p.lastsort = i
                }
                if (ts.p.multiSort) {
                    sotmp = $.inArray(idn, sortarr);
                    if (sotmp !== -1) {
                        ts.p.colModel[i].lso = sortord[sotmp]
                    }
                }
                thead += imgs + "</div></th>"
            }
            thead += "</tr></thead>";
            imgs = null;
            $(this).append(thead).find("#jqgh_" + ts.p.id + "_rn").width(25);
            $("thead tr:first th", this).hover(function() {
                $(this).addClass("ui-state-hover")
            },
            function() {
                $(this).removeClass("ui-state-hover")
            });
            if (this.p.multiselect) {
                var emp = [],
                chk;
                $("#cb_" + $.jgrid.jqID(ts.p.id), this).bind("click",
                function() {
                    ts.p.selarrrow = [];
                    var froz = ts.p.frozenColumns === true ? ts.p.id + "_frozen": "";
                    if (this.checked) {
                        $(ts.rows).each(function(i) {
                            if (i > 0) {
                                if (!$(this).hasClass("ui-subgrid") && !$(this).hasClass("jqgroup") && !$(this).hasClass("ui-state-disabled") && !$(this).hasClass("jqfoot")) {
                                    $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + $.jgrid.jqID(this.id))[ts.p.useProp ? "prop": "attr"]("checked", true);
                                    $(this).addClass("ui-state-highlight").attr("aria-selected", "true");
                                    ts.p.selarrrow.push(this.id);
                                    ts.p.selrow = this.id;
                                    if (froz) {
                                        $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + $.jgrid.jqID(this.id), ts.grid.fbDiv)[ts.p.useProp ? "prop": "attr"]("checked", true);
                                        $("#" + $.jgrid.jqID(this.id), ts.grid.fbDiv).addClass("ui-state-highlight")
                                    }
                                }
                            }
                        });
                        chk = true;
                        emp = []
                    } else {
                        $(ts.rows).each(function(i) {
                            if (i > 0) {
                                if (!$(this).hasClass("ui-subgrid") && !$(this).hasClass("jqgroup") && !$(this).hasClass("ui-state-disabled") && !$(this).hasClass("jqfoot")) {
                                    $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + $.jgrid.jqID(this.id))[ts.p.useProp ? "prop": "attr"]("checked", false);
                                    $(this).removeClass("ui-state-highlight").attr("aria-selected", "false");
                                    emp.push(this.id);
                                    if (froz) {
                                        $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + $.jgrid.jqID(this.id), ts.grid.fbDiv)[ts.p.useProp ? "prop": "attr"]("checked", false);
                                        $("#" + $.jgrid.jqID(this.id), ts.grid.fbDiv).removeClass("ui-state-highlight")
                                    }
                                }
                            }
                        });
                        ts.p.selrow = null;
                        chk = false
                    }
                    $(ts).triggerHandler("jqGridSelectAll", [chk ? ts.p.selarrrow: emp, chk]);
                    if ($.isFunction(ts.p.onSelectAll)) {
                        ts.p.onSelectAll.call(ts, chk ? ts.p.selarrrow: emp, chk)
                    }
                })
            }
            if (ts.p.autowidth === true) {
                var pw = $(eg).innerWidth();
                ts.p.width = pw > 0 ? pw: "nw"
            }
            setColWidth();
            $(eg).css("width", grid.width + "px").append("<div class='ui-jqgrid-resize-mark' id='rs_m" + ts.p.id + "'>&#160;</div>");
            $(gv).css("width", grid.width + "px");
            thead = $("thead:first", ts).get(0);
            var tfoot = "";
            if (ts.p.footerrow) {
                tfoot += "<table role='presentation' style='width:" + ts.p.tblwidth + "px' class='ui-jqgrid-ftable' cellspacing='0' cellpadding='0' border='0'><tbody><tr role='row' class='ui-widget-content footrow footrow-" + dir + "'>"
            }
            var thr = $("tr:first", thead),
            firstr = "<tr class='jqgfirstrow' role='row' style='height:auto'>";
            ts.p.disableClick = false;
            $("th", thr).each(function(j) {
                w = ts.p.colModel[j].width;
                if (ts.p.colModel[j].resizable === undefined) {
                    ts.p.colModel[j].resizable = true
                }
                if (ts.p.colModel[j].resizable) {
                    res = document.createElement("span");
                    $(res).html("&#160;").addClass("ui-jqgrid-resize ui-jqgrid-resize-" + dir).css("cursor", "col-resize");
                    $(this).addClass(ts.p.resizeclass)
                } else {
                    res = ""
                }
                $(this).css("width", w + "px").prepend(res);
                res = null;
                var hdcol = "";
                if (ts.p.colModel[j].hidden) {
                    $(this).css("display", "none");
                    hdcol = "display:none;"
                }
                firstr += "<td role='gridcell' style='height:0px;width:" + w + "px;" + hdcol + "'></td>";
                grid.headers[j] = {
                    width: w,
                    el: this
                };
                sort = ts.p.colModel[j].sortable;
                if (typeof sort !== "boolean") {
                    ts.p.colModel[j].sortable = true;
                    sort = true
                }
                var nm = ts.p.colModel[j].name;
                if (! (nm === "cb" || nm === "subgrid" || nm === "rn")) {
                    if (ts.p.viewsortcols[2]) {
                        $(">div", this).addClass("ui-jqgrid-sortable")
                    }
                }
                if (sort) {
                    if (ts.p.multiSort) {
                        if (ts.p.viewsortcols[0]) {
                            $("div span.s-ico", this).show();
                            if (ts.p.colModel[j].lso) {
                                $("div span.ui-icon-" + ts.p.colModel[j].lso, this).removeClass("ui-state-disabled")
                            }
                        } else {
                            if (ts.p.colModel[j].lso) {
                                $("div span.s-ico", this).show();
                                $("div span.ui-icon-" + ts.p.colModel[j].lso, this).removeClass("ui-state-disabled")
                            }
                        }
                    } else {
                        if (ts.p.viewsortcols[0]) {
                            $("div span.s-ico", this).show();
                            if (j === ts.p.lastsort) {
                                $("div span.ui-icon-" + ts.p.sortorder, this).removeClass("ui-state-disabled")
                            }
                        } else {
                            if (j === ts.p.lastsort && ts.p.sortname !== "") {
                                $("div span.s-ico", this).show();
                                $("div span.ui-icon-" + ts.p.sortorder, this).removeClass("ui-state-disabled")
                            }
                        }
                    }
                }
                if (ts.p.footerrow) {
                    tfoot += "<td role='gridcell' " + formatCol(j, 0, "", null, "", false) + ">&#160;</td>"
                }
            }).mousedown(function(e) {
                if ($(e.target).closest("th>span.ui-jqgrid-resize").length !== 1) {
                    return
                }
                var ci = getColumnHeaderIndex(this);
                if (ts.p.forceFit === true) {
                    ts.p.nv = nextVisible(ci)
                }
                grid.dragStart(ci, e, getOffset(ci));
                return false
            }).click(function(e) {
                if (ts.p.disableClick) {
                    ts.p.disableClick = false;
                    return false
                }
                var s = "th>div.ui-jqgrid-sortable",
                r, d;
                if (!ts.p.viewsortcols[2]) {
                    s = "th>div>span>span.ui-grid-ico-sort"
                }
                var t = $(e.target).closest(s);
                if (t.length !== 1) {
                    return
                }
                var ci;
                if (ts.p.frozenColumns) {
                    var tid = $(this)[0].id.substring(ts.p.id.length + 1);
                    $(ts.p.colModel).each(function(i) {
                        if (this.name === tid) {
                            ci = i;
                            return false
                        }
                    })
                } else {
                    ci = getColumnHeaderIndex(this)
                }
                if (!ts.p.viewsortcols[2]) {
                    r = true;
                    d = t.attr("sort")
                }
                if (ci != null) {
                    sortData($("div", this)[0].id, ci, r, d, this)
                }
                return false
            });
            if (ts.p.sortable && $.fn.sortable) {
                try {
                    $(ts).jqGrid("sortableColumns", thr)
                } catch(e) {}
            }
            if (ts.p.footerrow) {
                tfoot += "</tr></tbody></table>"
            }
            firstr += "</tr>";
            tbody = document.createElement("tbody");
            this.appendChild(tbody);
            $(this).addClass("ui-jqgrid-btable").append(firstr);
            firstr = null;
            var hTable = $("<table class='ui-jqgrid-htable' style='width:" + ts.p.tblwidth + "px' role='presentation' aria-labelledby='gbox_" + this.id + "' cellspacing='0' cellpadding='0' border='0'></table>").append(thead),
            hg = (ts.p.caption && ts.p.hiddengrid === true) ? true: false,
            hb = $("<div class='ui-jqgrid-hbox" + (dir === "rtl" ? "-rtl": "") + "'></div>");
            thead = null;
            grid.hDiv = document.createElement("div");
            $(grid.hDiv).css({
                width: grid.width + "px"
            }).addClass("ui-state-default ui-jqgrid-hdiv").append(hb);
            $(hb).append(hTable);
            hTable = null;
            if (hg) {
                $(grid.hDiv).hide()
            }
            if (ts.p.pager) {
                if (typeof ts.p.pager === "string") {
                    if (ts.p.pager.substr(0, 1) !== "#") {
                        ts.p.pager = "#" + ts.p.pager
                    }
                } else {
                    ts.p.pager = "#" + $(ts.p.pager).attr("id")
                }
                $(ts.p.pager).css({
                    width: grid.width + "px"
                }).addClass("ui-state-default ui-jqgrid-pager ui-corner-bottom").appendTo(eg);
                if (hg) {
                    $(ts.p.pager).hide()
                }
                setPager(ts.p.pager, "")
            }
            if (ts.p.cellEdit === false && ts.p.hoverrows === true) {
                $(ts).bind("mouseover",
                function(e) {
                    ptr = $(e.target).closest("tr.jqgrow");
                    if ($(ptr).attr("class") !== "ui-subgrid") {
                        $(ptr).addClass("ui-state-hover")
                    }
                }).bind("mouseout",
                function(e) {
                    ptr = $(e.target).closest("tr.jqgrow");
                    $(ptr).removeClass("ui-state-hover")
                })
            }
            var ri, ci, tdHtml;
            $(ts).before(grid.hDiv).click(function(e) {
                td = e.target;
                ptr = $(td, ts.rows).closest("tr.jqgrow");
                if ($(ptr).length === 0 || ptr[0].className.indexOf("ui-state-disabled") > -1 || ($(td, ts).closest("table.ui-jqgrid-btable").attr("id") || "").replace("_frozen", "") !== ts.id) {
                    return this
                }
                var scb = $(td).hasClass("cbox"),
                cSel = $(ts).triggerHandler("jqGridBeforeSelectRow", [ptr[0].id, e]);
                cSel = (cSel === false || cSel === "stop") ? false: true;
                if ($.isFunction(ts.p.beforeSelectRow)) {
                    var allowRowSelect = ts.p.beforeSelectRow.call(ts, ptr[0].id, e);
                    if (allowRowSelect === false || allowRowSelect === "stop") {
                        cSel = false
                    }
                }
                if (td.tagName === "A" || ((td.tagName === "INPUT" || td.tagName === "TEXTAREA" || td.tagName === "OPTION" || td.tagName === "SELECT") && !scb)) {
                    return
                }
                ri = ptr[0].id;
                td = $(td).closest("tr.jqgrow>td");
                if (td.length > 0) {
                    ci = $.jgrid.getCellIndex(td);
                    tdHtml = $(td).closest("td,th").html();
                    $(ts).triggerHandler("jqGridCellSelect", [ri, ci, tdHtml, e]);
                    if ($.isFunction(ts.p.onCellSelect)) {
                        ts.p.onCellSelect.call(ts, ri, ci, tdHtml, e)
                    }
                }
                if (ts.p.cellEdit === true) {
                    if (ts.p.multiselect && scb && cSel) {
                        $(ts).jqGrid("setSelection", ri, true, e)
                    } else {
                        if (td.length > 0) {
                            ri = ptr[0].rowIndex;
                            try {
                                $(ts).jqGrid("editCell", ri, ci, true)
                            } catch(_) {}
                        }
                    }
                }
                if (!cSel) {
                    return
                }
                if (!ts.p.multikey) {
                    if (ts.p.multiselect && ts.p.multiboxonly) {
                        if (scb) {
                            $(ts).jqGrid("setSelection", ri, true, e)
                        } else {
                            var frz = ts.p.frozenColumns ? ts.p.id + "_frozen": "";
                            $(ts.p.selarrrow).each(function(i, n) {
                                var trid = $(ts).jqGrid("getGridRowById", n);
                                if (trid) {
                                    $(trid).removeClass("ui-state-highlight")
                                }
                                $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + $.jgrid.jqID(n))[ts.p.useProp ? "prop": "attr"]("checked", false);
                                if (frz) {
                                    $("#" + $.jgrid.jqID(n), "#" + $.jgrid.jqID(frz)).removeClass("ui-state-highlight");
                                    $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + $.jgrid.jqID(n), "#" + $.jgrid.jqID(frz))[ts.p.useProp ? "prop": "attr"]("checked", false)
                                }
                            });
                            ts.p.selarrrow = [];
                            $(ts).jqGrid("setSelection", ri, true, e)
                        }
                    } else {
                        $(ts).jqGrid("setSelection", ri, true, e)
                    }
                } else {
                    if (e[ts.p.multikey]) {
                        $(ts).jqGrid("setSelection", ri, true, e)
                    } else {
                        if (ts.p.multiselect && scb) {
                            scb = $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + ri).is(":checked");
                            $("#jqg_" + $.jgrid.jqID(ts.p.id) + "_" + ri)[ts.p.useProp ? "prop": "attr"]("checked", scb)
                        }
                    }
                }
            }).bind("reloadGrid",
            function(e, opts) {
                if (ts.p.treeGrid === true) {
                    ts.p.datatype = ts.p.treedatatype
                }
                if (opts && opts.current) {
                    ts.grid.selectionPreserver(ts)
                }
                if (ts.p.datatype === "local") {
                    $(ts).jqGrid("resetSelection");
                    if (ts.p.data.length) {
                        normalizeData();
                        refreshIndex()
                    }
                } else {
                    if (!ts.p.treeGrid) {
                        ts.p.selrow = null;
                        if (ts.p.multiselect) {
                            ts.p.selarrrow = [];
                            setHeadCheckBox(false)
                        }
                        ts.p.savedRow = []
                    }
                }
                if (ts.p.scroll) {
                    emptyRows.call(ts, true, false)
                }
                if (opts && opts.page) {
                    var page = opts.page;
                    if (page > ts.p.lastpage) {
                        page = ts.p.lastpage
                    }
                    if (page < 1) {
                        page = 1
                    }
                    ts.p.page = page;
                    if (ts.grid.prevRowHeight) {
                        ts.grid.bDiv.scrollTop = (page - 1) * ts.grid.prevRowHeight * ts.p.rowNum
                    } else {
                        ts.grid.bDiv.scrollTop = 0
                    }
                }
                if (ts.grid.prevRowHeight && ts.p.scroll) {
                    delete ts.p.lastpage;
                    ts.grid.populateVisible()
                } else {
                    ts.grid.populate()
                }
                if (ts.p._inlinenav === true) {
                    $(ts).jqGrid("showAddEditButtons")
                }
                return false
            }).dblclick(function(e) {
                td = e.target;
                ptr = $(td, ts.rows).closest("tr.jqgrow");
                if ($(ptr).length === 0) {
                    return
                }
                ri = ptr[0].rowIndex;
                ci = $.jgrid.getCellIndex(td);
                var dbcr = $(ts).triggerHandler("jqGridDblClickRow", [$(ptr).attr("id"), ri, ci, e]);
                if (dbcr != null) {
                    return dbcr
                }
                if ($.isFunction(ts.p.ondblClickRow)) {
                    dbcr = ts.p.ondblClickRow.call(ts, $(ptr).attr("id"), ri, ci, e);
                    if (dbcr != null) {
                        return dbcr
                    }
                }
            }).bind("contextmenu",
            function(e) {
                td = e.target;
                ptr = $(td, ts.rows).closest("tr.jqgrow");
                if ($(ptr).length === 0) {
                    return
                }
                if (!ts.p.multiselect) {
                    $(ts).jqGrid("setSelection", ptr[0].id, true, e)
                }
                ri = ptr[0].rowIndex;
                ci = $.jgrid.getCellIndex(td);
                var rcr = $(ts).triggerHandler("jqGridRightClickRow", [$(ptr).attr("id"), ri, ci, e]);
                if (rcr != null) {
                    return rcr
                }
                if ($.isFunction(ts.p.onRightClickRow)) {
                    rcr = ts.p.onRightClickRow.call(ts, $(ptr).attr("id"), ri, ci, e);
                    if (rcr != null) {
                        return rcr
                    }
                }
            });
            grid.bDiv = document.createElement("div");
            if (isMSIE) {
                if (String(ts.p.height).toLowerCase() === "auto") {
                    ts.p.height = "100%"
                }
            }
            $(grid.bDiv).append(this).addClass("ui-jqgrid-bdiv").css({
                height: ts.p.height + (isNaN(ts.p.height) ? "": "px"),
                width: (grid.width) + "px"
            }).scroll(grid.scrollGrid);
            $("table:first", grid.bDiv).css({
                width: ts.p.tblwidth + "px"
            });
            if (!$.support.tbody) {
                if ($("tbody", this).length === 2) {
                    $("tbody:gt(0)", this).remove()
                }
            }
            if (ts.p.multikey) {
                if ($.jgrid.msie) {
                    $(grid.bDiv).bind("selectstart",
                    function() {
                        return false
                    })
                } else {
                    $(grid.bDiv).bind("mousedown",
                    function() {
                        return false
                    })
                }
            }
            if (hg) {
                $(grid.bDiv).hide()
            }
            grid.cDiv = document.createElement("div");
            var arf = ts.p.hidegrid === true ? $("<a role='link' class='ui-jqgrid-titlebar-close ui-corner-all HeaderButton' " + (ts.p.showhide ? "title='" + ts.p.showhide + "'": "") + " />").hover(function() {
                arf.addClass("ui-state-hover")
            },
            function() {
                arf.removeClass("ui-state-hover")
            }).append("<span class='ui-icon ui-icon-circle-triangle-n'></span>").css((dir === "rtl" ? "left": "right"), "0px") : "";
            $(grid.cDiv).append(arf).append("<span class='ui-jqgrid-title'>" + ts.p.caption + "</span>").addClass("ui-jqgrid-titlebar ui-jqgrid-caption" + (dir === "rtl" ? "-rtl": "") + " ui-widget-header ui-corner-top ui-helper-clearfix");
            $(grid.cDiv).insertBefore(grid.hDiv);
            if (ts.p.toolbar[0]) {
                grid.uDiv = document.createElement("div");
                if (ts.p.toolbar[1] === "top") {
                    $(grid.uDiv).insertBefore(grid.hDiv)
                } else {
                    if (ts.p.toolbar[1] === "bottom") {
                        $(grid.uDiv).insertAfter(grid.hDiv)
                    }
                }
                if (ts.p.toolbar[1] === "both") {
                    grid.ubDiv = document.createElement("div");
                    $(grid.uDiv).addClass("ui-userdata ui-state-default").attr("id", "t_" + this.id).insertBefore(grid.hDiv);
                    $(grid.ubDiv).addClass("ui-userdata ui-state-default").attr("id", "tb_" + this.id).insertAfter(grid.hDiv);
                    if (hg) {
                        $(grid.ubDiv).hide()
                    }
                } else {
                    $(grid.uDiv).width(grid.width).addClass("ui-userdata ui-state-default").attr("id", "t_" + this.id)
                }
                if (hg) {
                    $(grid.uDiv).hide()
                }
            }
            if (ts.p.toppager) {
                ts.p.toppager = $.jgrid.jqID(ts.p.id) + "_toppager";
                grid.topDiv = $("<div id='" + ts.p.toppager + "'></div>")[0];
                ts.p.toppager = "#" + ts.p.toppager;
                $(grid.topDiv).addClass("ui-state-default ui-jqgrid-toppager").width(grid.width).insertBefore(grid.hDiv);
                setPager(ts.p.toppager, "_t")
            }
            if (ts.p.footerrow) {
                grid.sDiv = $("<div class='ui-jqgrid-sdiv'></div>")[0];
                hb = $("<div class='ui-jqgrid-hbox" + (dir === "rtl" ? "-rtl": "") + "'></div>");
                $(grid.sDiv).append(hb).width(grid.width).insertAfter(grid.hDiv);
                $(hb).append(tfoot);
                grid.footers = $(".ui-jqgrid-ftable", grid.sDiv)[0].rows[0].cells;
                if (ts.p.rownumbers) {
                    grid.footers[0].className = "ui-state-default jqgrid-rownum"
                }
                if (hg) {
                    $(grid.sDiv).hide()
                }
            }
            hb = null;
            if (ts.p.caption) {
                var tdt = ts.p.datatype;
                if (ts.p.hidegrid === true) {
                    $(".ui-jqgrid-titlebar-close", grid.cDiv).click(function(e) {
                        var onHdCl = $.isFunction(ts.p.onHeaderClick),
                        elems = ".ui-jqgrid-bdiv, .ui-jqgrid-hdiv, .ui-jqgrid-pager, .ui-jqgrid-sdiv",
                        counter,
                        self = this;
                        if (ts.p.toolbar[0] === true) {
                            if (ts.p.toolbar[1] === "both") {
                                elems += ", #" + $(grid.ubDiv).attr("id")
                            }
                            elems += ", #" + $(grid.uDiv).attr("id")
                        }
                        counter = $(elems, "#gview_" + $.jgrid.jqID(ts.p.id)).length;
                        if (ts.p.gridstate === "visible") {
                            $(elems, "#gbox_" + $.jgrid.jqID(ts.p.id)).slideUp("fast",
                            function() {
                                counter--;
                                if (counter === 0) {
                                    $("span", self).removeClass("ui-icon-circle-triangle-n").addClass("ui-icon-circle-triangle-s");
                                    ts.p.gridstate = "hidden";
                                    if ($("#gbox_" + $.jgrid.jqID(ts.p.id)).hasClass("ui-resizable")) {
                                        $(".ui-resizable-handle", "#gbox_" + $.jgrid.jqID(ts.p.id)).hide()
                                    }
                                    $(ts).triggerHandler("jqGridHeaderClick", [ts.p.gridstate, e]);
                                    if (onHdCl) {
                                        if (!hg) {
                                            ts.p.onHeaderClick.call(ts, ts.p.gridstate, e)
                                        }
                                    }
                                }
                            })
                        } else {
                            if (ts.p.gridstate === "hidden") {
                                $(elems, "#gbox_" + $.jgrid.jqID(ts.p.id)).slideDown("fast",
                                function() {
                                    counter--;
                                    if (counter === 0) {
                                        $("span", self).removeClass("ui-icon-circle-triangle-s").addClass("ui-icon-circle-triangle-n");
                                        if (hg) {
                                            ts.p.datatype = tdt;
                                            populate();
                                            hg = false
                                        }
                                        ts.p.gridstate = "visible";
                                        if ($("#gbox_" + $.jgrid.jqID(ts.p.id)).hasClass("ui-resizable")) {
                                            $(".ui-resizable-handle", "#gbox_" + $.jgrid.jqID(ts.p.id)).show()
                                        }
                                        $(ts).triggerHandler("jqGridHeaderClick", [ts.p.gridstate, e]);
                                        if (onHdCl) {
                                            if (!hg) {
                                                ts.p.onHeaderClick.call(ts, ts.p.gridstate, e)
                                            }
                                        }
                                    }
                                })
                            }
                        }
                        return false
                    });
                    if (hg) {
                        ts.p.datatype = "local";
                        $(".ui-jqgrid-titlebar-close", grid.cDiv).trigger("click")
                    }
                }
            } else {
                $(grid.cDiv).hide();
                if (!ts.p.toppager) {
                    $(grid.hDiv).addClass("ui-corner-top")
                }
            }
            $(grid.hDiv).after(grid.bDiv).mousemove(function(e) {
                if (grid.resizing) {
                    grid.dragMove(e);
                    return false
                }
            });
            $(".ui-jqgrid-labels", grid.hDiv).bind("selectstart",
            function() {
                return false
            });
            $(document).bind("mouseup.jqGrid" + ts.p.id,
            function() {
                if (grid.resizing) {
                    grid.dragEnd();
                    return false
                }
                return true
            });
            ts.formatCol = formatCol;
            ts.sortData = sortData;
            ts.updatepager = updatepager;
            ts.refreshIndex = refreshIndex;
            ts.setHeadCheckBox = setHeadCheckBox;
            ts.constructTr = constructTr;
            ts.formatter = function(rowId, cellval, colpos, rwdat, act) {
                return formatter(rowId, cellval, colpos, rwdat, act)
            };
            $.extend(grid, {
                populate: populate,
                emptyRows: emptyRows,
                beginReq: beginReq,
                endReq: endReq
            });
            this.grid = grid;
            ts.addXmlData = function(d) {
                addXmlData(d, ts.grid.bDiv)
            };
            ts.addJSONData = function(d) {
                addJSONData(d, ts.grid.bDiv)
            };
            this.grid.cols = this.rows[0].cells;
            $(ts).triggerHandler("jqGridInitGrid");
            if ($.isFunction(ts.p.onInitGrid)) {
                ts.p.onInitGrid.call(ts)
            }
            populate();
            ts.p.hiddengrid = false
        })
    };
    $.jgrid.extend({
        getGridParam: function(pName) {
            var $t = this[0];
            if (!$t || !$t.grid) {
                return
            }
            if (!pName) {
                return $t.p
            }
            return $t.p[pName] !== undefined ? $t.p[pName] : null
        },
        setGridParam: function(newParams, overwrite) {

            return this.each(function() {
                if (overwrite == null) {
                    overwrite = false
                }
                if (this.grid && typeof newParams === "object") {
                    if (overwrite === true) {
                        var params = $.extend({},
                        this.p, newParams);
                        this.p = params
                    } else {
                        $.extend(true, this.p, newParams)
                    }
                }
            })
        },
        getGridRowById: function(rowid) {
            var row;
            this.each(function() {
                try {
                    var i = this.rows.length;
                    while (i--) {
                        if (rowid.toString() === this.rows[i].id) {
                            row = this.rows[i];
                            break
                        }
                    }
                } catch(e) {
                    row = $(this.grid.bDiv).find("#" + $.jgrid.jqID(rowid))
                }
            });
            return row
        },
        getDataIDs: function() {
            var ids = [],
            i = 0,
            len,
            j = 0;
            this.each(function() {
                len = this.rows.length;
                if (len && len > 0) {
                    while (i < len) {
                        if ($(this.rows[i]).hasClass("jqgrow")) {
                            ids[j] = this.rows[i].id;
                            j++
                        }
                        i++
                    }
                }
            });
            return ids
        },
        setSelection: function(selection, onsr, e) {
            return this.each(function() {
                var $t = this,
                stat, pt, ner, ia, tpsr, fid, csr;
                if (selection === undefined) {
                    return
                }
                onsr = onsr === false ? false: true;
                pt = $($t).jqGrid("getGridRowById", selection);
                if (!pt || !pt.className || pt.className.indexOf("ui-state-disabled") > -1) {
                    return
                }
                function scrGrid(iR) {
                    var ch = $($t.grid.bDiv)[0].clientHeight,
                    st = $($t.grid.bDiv)[0].scrollTop,
                    rpos = $($t.rows[iR]).position().top,
                    rh = $t.rows[iR].clientHeight;
                    if (rpos + rh >= ch + st) {
                        $($t.grid.bDiv)[0].scrollTop = rpos - (ch + st) + rh + st
                    } else {
                        if (rpos < ch + st) {
                            if (rpos < st) {
                                $($t.grid.bDiv)[0].scrollTop = rpos
                            }
                        }
                    }
                }
                if ($t.p.scrollrows === true) {
                    ner = $($t).jqGrid("getGridRowById", selection).rowIndex;
                    if (ner >= 0) {
                        scrGrid(ner)
                    }
                }
                if ($t.p.frozenColumns === true) {
                    fid = $t.p.id + "_frozen"
                }
                if (!$t.p.multiselect) {
                    if (pt.className !== "ui-subgrid") {
                        if ($t.p.selrow !== pt.id) {
                            csr = $($t).jqGrid("getGridRowById", $t.p.selrow);
                            if (csr) {
                                $(csr).removeClass("ui-state-highlight").attr({
                                    "aria-selected": "false",
                                    tabindex: "-1"
                                })
                            }
                            $(pt).addClass("ui-state-highlight").attr({
                                "aria-selected": "true",
                                tabindex: "0"
                            });
                            if (fid) {
                                $("#" + $.jgrid.jqID($t.p.selrow), "#" + $.jgrid.jqID(fid)).removeClass("ui-state-highlight");
                                $("#" + $.jgrid.jqID(selection), "#" + $.jgrid.jqID(fid)).addClass("ui-state-highlight")
                            }
                            stat = true
                        } else {
                            stat = false
                        }
                        $t.p.selrow = pt.id;
                        if (onsr) {
                            $($t).triggerHandler("jqGridSelectRow", [pt.id, stat, e]);
                            if ($t.p.onSelectRow) {
                                $t.p.onSelectRow.call($t, pt.id, stat, e)
                            }
                        }
                    }
                } else {
                    $t.setHeadCheckBox(false);
                    $t.p.selrow = pt.id;
                    ia = $.inArray($t.p.selrow, $t.p.selarrrow);
                    if (ia === -1) {
                        if (pt.className !== "ui-subgrid") {
                            $(pt).addClass("ui-state-highlight").attr("aria-selected", "true")
                        }
                        stat = true;
                        $t.p.selarrrow.push($t.p.selrow)
                    } else {
                        if (pt.className !== "ui-subgrid") {
                            $(pt).removeClass("ui-state-highlight").attr("aria-selected", "false")
                        }
                        stat = false;
                        $t.p.selarrrow.splice(ia, 1);
                        tpsr = $t.p.selarrrow[0];
                        $t.p.selrow = (tpsr === undefined) ? null: tpsr
                    }
                    $("#jqg_" + $.jgrid.jqID($t.p.id) + "_" + $.jgrid.jqID(pt.id))[$t.p.useProp ? "prop": "attr"]("checked", stat);
                    if (fid) {
                        if (ia === -1) {
                            $("#" + $.jgrid.jqID(selection), "#" + $.jgrid.jqID(fid)).addClass("ui-state-highlight")
                        } else {
                            $("#" + $.jgrid.jqID(selection), "#" + $.jgrid.jqID(fid)).removeClass("ui-state-highlight")
                        }
                        $("#jqg_" + $.jgrid.jqID($t.p.id) + "_" + $.jgrid.jqID(selection), "#" + $.jgrid.jqID(fid))[$t.p.useProp ? "prop": "attr"]("checked", stat)
                    }
                    if (onsr) {
                        $($t).triggerHandler("jqGridSelectRow", [pt.id, stat, e]);
                        if ($t.p.onSelectRow) {
                            $t.p.onSelectRow.call($t, pt.id, stat, e)
                        }
                    }
                }
            })
        },
        resetSelection: function(rowid) {
            return this.each(function() {
                var t = this,
                sr, fid;
                if (t.p.frozenColumns === true) {
                    fid = t.p.id + "_frozen"
                }
                if (rowid !== undefined) {
                    sr = rowid === t.p.selrow ? t.p.selrow: rowid;
                    $("#" + $.jgrid.jqID(t.p.id) + " tbody:first tr#" + $.jgrid.jqID(sr)).removeClass("ui-state-highlight").attr("aria-selected", "false");
                    if (fid) {
                        $("#" + $.jgrid.jqID(sr), "#" + $.jgrid.jqID(fid)).removeClass("ui-state-highlight")
                    }
                    if (t.p.multiselect) {
                        $("#jqg_" + $.jgrid.jqID(t.p.id) + "_" + $.jgrid.jqID(sr), "#" + $.jgrid.jqID(t.p.id))[t.p.useProp ? "prop": "attr"]("checked", false);
                        if (fid) {
                            $("#jqg_" + $.jgrid.jqID(t.p.id) + "_" + $.jgrid.jqID(sr), "#" + $.jgrid.jqID(fid))[t.p.useProp ? "prop": "attr"]("checked", false)
                        }
                        t.setHeadCheckBox(false);
                        var ia = $.inArray($.jgrid.jqID(sr), t.p.selarrrow);
                        if (ia !== -1) {
                            t.p.selarrrow.splice(ia, 1)
                        }
                    }
                    sr = null
                } else {
                    if (!t.p.multiselect) {
                        if (t.p.selrow) {
                            $("#" + $.jgrid.jqID(t.p.id) + " tbody:first tr#" + $.jgrid.jqID(t.p.selrow)).removeClass("ui-state-highlight").attr("aria-selected", "false");
                            if (fid) {
                                $("#" + $.jgrid.jqID(t.p.selrow), "#" + $.jgrid.jqID(fid)).removeClass("ui-state-highlight")
                            }
                            t.p.selrow = null
                        }
                    } else {
                        $(t.p.selarrrow).each(function(i, n) {
                            $($(t).jqGrid("getGridRowById", n)).removeClass("ui-state-highlight").attr("aria-selected", "false");
                            $("#jqg_" + $.jgrid.jqID(t.p.id) + "_" + $.jgrid.jqID(n))[t.p.useProp ? "prop": "attr"]("checked", false);
                            if (fid) {
                                $("#" + $.jgrid.jqID(n), "#" + $.jgrid.jqID(fid)).removeClass("ui-state-highlight");
                                $("#jqg_" + $.jgrid.jqID(t.p.id) + "_" + $.jgrid.jqID(n), "#" + $.jgrid.jqID(fid))[t.p.useProp ? "prop": "attr"]("checked", false)
                            }
                        });
                        t.setHeadCheckBox(false);
                        t.p.selarrrow = [];
                        t.p.selrow = null
                    }
                }
                if (t.p.cellEdit === true) {
                    if (parseInt(t.p.iCol, 10) >= 0 && parseInt(t.p.iRow, 10) >= 0) {
                        $("td:eq(" + t.p.iCol + ")", t.rows[t.p.iRow]).removeClass("edit-cell ui-state-highlight");
                        $(t.rows[t.p.iRow]).removeClass("selected-row ui-state-hover")
                    }
                }
                t.p.savedRow = []
            })
        },
        getRowData: function(rowid) {
            var res = {},
            resall, getall = false,
            len, j = 0;
            this.each(function() {
                var $t = this,
                nm, ind;
                if (rowid === undefined) {
                    getall = true;
                    resall = [];
                    len = $t.rows.length
                } else {
                    ind = $($t).jqGrid("getGridRowById", rowid);
                    if (!ind) {
                        return res
                    }
                    len = 2
                }
                while (j < len) {
                    if (getall) {
                        ind = $t.rows[j]
                    }
                    if ($(ind).hasClass("jqgrow")) {
                        $('td[role="gridcell"]', ind).each(function(i) {
                            nm = $t.p.colModel[i].name;
                            if (nm !== "cb" && nm !== "subgrid" && nm !== "rn") {
                                if ($t.p.treeGrid === true && nm === $t.p.ExpandColumn) {
                                    res[nm] = $.jgrid.htmlDecode($("span:first", this).html())
                                } else {
                                    try {
                                        res[nm] = $.unformat.call($t, this, {
                                            rowId: ind.id,
                                            colModel: $t.p.colModel[i]
                                        },
                                        i)
                                    } catch(e) {
                                        res[nm] = $.jgrid.htmlDecode($(this).html())
                                    }
                                }
                            }
                        });
                        if (getall) {
                            resall.push(res);
                            res = {}
                        }
                    }
                    j++
                }
            });
            return resall || res
        },
        delRowData: function(rowid) {
            var success = false,
            rowInd, ia, nextRow;
            this.each(function() {
                var $t = this;
                rowInd = $($t).jqGrid("getGridRowById", rowid);
                if (!rowInd) {
                    return false
                }
                if ($t.p.subGrid) {
                    nextRow = $(rowInd).next();
                    if (nextRow.hasClass("ui-subgrid")) {
                        nextRow.remove()
                    }
                }
                $(rowInd).remove();
                $t.p.records--;
                $t.p.reccount--;
                $t.updatepager(true, false);
                success = true;
                if ($t.p.multiselect) {
                    ia = $.inArray(rowid, $t.p.selarrrow);
                    if (ia !== -1) {
                        $t.p.selarrrow.splice(ia, 1)
                    }
                }
                if ($t.p.multiselect && $t.p.selarrrow.length > 0) {
                    $t.p.selrow = $t.p.selarrrow[$t.p.selarrrow.length - 1]
                } else {
                    $t.p.selrow = null
                }
                if ($t.p.datatype === "local") {
                    var id = $.jgrid.stripPref($t.p.idPrefix, rowid),
                    pos = $t.p._index[id];
                    if (pos !== undefined) {
                        $t.p.data.splice(pos, 1);
                        $t.refreshIndex()
                    }
                }
                if ($t.p.altRows === true && success) {
                    var cn = $t.p.altclass;
                    $($t.rows).each(function(i) {
                        if (i % 2 === 0) {
                            $(this).addClass(cn)
                        } else {
                            $(this).removeClass(cn)
                        }
                    })
                }
            });
            return success
        },
        setRowData: function(rowid, data, cssp) {
            var nm, success = true,
            title;
            this.each(function() {
                if (!this.grid) {
                    return false
                }
                var t = this,
                vl, ind, cp = typeof cssp,
                lcdata = {};
                ind = $(this).jqGrid("getGridRowById", rowid);
                if (!ind) {
                    return false
                }
                if (data) {
                    try {
                        $(this.p.colModel).each(function(i) {
                            nm = this.name;
                            var dval = $.jgrid.getAccessor(data, nm);
                            if (dval !== undefined) {
                                lcdata[nm] = this.formatter && typeof this.formatter === "string" && this.formatter === "date" ? $.unformat.date.call(t, dval, this) : dval;
                                vl = t.formatter(rowid, lcdata[nm], i, data, "edit");
                                title = this.title ? {
                                    title: $.jgrid.stripHtml(vl == "&#160;" ? "": vl)
                                }: {};
                                if (t.p.treeGrid === true && nm === t.p.ExpandColumn) {
                                    $("td[role='gridcell']:eq(" + i + ") > span:first", ind).html(vl).attr(title)
                                } else {
                                    $("td[role='gridcell']:eq(" + i + ")", ind).html(vl).attr(title)
                                }
                            }
                        });
                        if (t.p.datatype === "local") {
                            var id = $.jgrid.stripPref(t.p.idPrefix, rowid),
                            pos = t.p._index[id],
                            key;
                            if (t.p.treeGrid) {
                                for (key in t.p.treeReader) {
                                    if (t.p.treeReader.hasOwnProperty(key)) {
                                        delete lcdata[t.p.treeReader[key]]
                                    }
                                }
                            }
                            if (pos !== undefined) {
                                t.p.data[pos] = $.extend(true, t.p.data[pos], lcdata)
                            }
                            lcdata = null
                        }
                    } catch(e) {
                        success = false
                    }
                }
                if (success) {
                    if (cp === "string") {
                        $(ind).addClass(cssp)
                    } else {
                        if (cssp !== null && cp === "object") {
                            $(ind).css(cssp)
                        }
                    }
                    $(t).triggerHandler("jqGridAfterGridComplete")
                }
            });
            return success
        },
        addRowData: function(rowid, rdata, pos, src) {
            try {
                if (["first", "last", "before", "after"].indexOf(pos) == -1) {
                    pos = "last"
                }
            } catch(e) {}
            var success = false,
            nm, row, gi, si, ni, sind, i, v, prp = "",
            aradd, cnm, cn, data, cm, id;
            if (rdata) {
                if ($.isArray(rdata)) {
                    aradd = true;
                    cnm = rowid
                } else {
                    rdata = [rdata];
                    aradd = false
                }
                this.each(function() {
                    var t = this,
                    datalen = rdata.length;
                    ni = t.p.rownumbers === true ? 1 : 0;
                    gi = t.p.multiselect === true ? 1 : 0;
                    si = t.p.subGrid === true ? 1 : 0;
                    if (!aradd) {
                        if (rowid !== undefined) {
                            rowid = String(rowid)
                        } else {
                            rowid = $.jgrid.randId();
                            if (t.p.keyName !== false) {
                                cnm = t.p.keyName;
                                if (rdata[0][cnm] !== undefined) {
                                    rowid = rdata[0][cnm]
                                }
                            }
                        }
                    }
                    cn = t.p.altclass;
                    var k = 0,
                    cna = "",
                    lcdata = {},
                    air = $.isFunction(t.p.afterInsertRow) ? true: false;
                    while (k < datalen) {
                        data = rdata[k];
                        row = [];
                        if (aradd) {
                            try {
                                rowid = data[cnm];
                                if (rowid === undefined) {
                                    rowid = $.jgrid.randId()
                                }
                            } catch(e) {
                                rowid = $.jgrid.randId()
                            }
                            cna = t.p.altRows === true ? (t.rows.length - 1) % 2 === 0 ? cn: "": ""
                        }
                        id = rowid;
                        rowid = t.p.idPrefix + rowid;
                        if (ni) {
                            prp = t.formatCol(0, 1, "", null, rowid, true);
                            row[row.length] = '<td role="gridcell" class="ui-state-default jqgrid-rownum" ' + prp + ">0</td>"
                        }
                        if (gi) {
                            v = '<input role="checkbox" type="checkbox" id="jqg_' + t.p.id + "_" + rowid + '" class="cbox noselect2"/>';
                            prp = t.formatCol(ni, 1, "", null, rowid, true);
                            row[row.length] = '<td role="gridcell" ' + prp + ">" + v + "</td>"
                        }
                        if (si) {
                            row[row.length] = $(t).jqGrid("addSubGridCell", gi + ni, 1)
                        }
                        for (i = gi + si + ni; i < t.p.colModel.length; i++) {
                            cm = t.p.colModel[i];
                            nm = cm.name;
                            lcdata[nm] = data[nm];
                            v = t.formatter(rowid, $.jgrid.getAccessor(data, nm), i, data);
                            prp = t.formatCol(i, 1, v, data, rowid, lcdata);
                            row[row.length] = '<td role="gridcell" ' + prp + ">" + v + "</td>"
                        }
                        row.unshift(t.constructTr(rowid, false, cna, lcdata, data, false));
                        row[row.length] = "</tr>";
                        if (t.rows.length === 0) {
                            $("table:first", t.grid.bDiv).append(row.join(""))
                        } else {
                            switch (pos) {
                            case "last":
                                $(t.rows[t.rows.length - 1]).after(row.join(""));
                                sind = t.rows.length - 1;
                                break;
                            case "first":
                                $(t.rows[0]).after(row.join(""));
                                sind = 1;
                                break;
                            case "after":
                                sind = $(t).jqGrid("getGridRowById", src);
                                if (sind) {
                                    if ($(t.rows[sind.rowIndex + 1]).hasClass("ui-subgrid")) {
                                        $(t.rows[sind.rowIndex + 1]).after(row)
                                    } else {
                                        $(sind).after(row.join(""))
                                    }
                                    sind = sind.rowIndex + 1
                                }
                                break;
                            case "before":
                                sind = $(t).jqGrid("getGridRowById", src);
                                if (sind) {
                                    $(sind).before(row.join(""));
                                    sind = sind.rowIndex - 1
                                }
                                break
                            }
                        }
                        if (t.p.subGrid === true) {
                            $(t).jqGrid("addSubGrid", gi + ni, sind)
                        }
                        t.p.records++;
                        t.p.reccount++;
                        $(t).triggerHandler("jqGridAfterInsertRow", [rowid, data, data]);
                        if (air) {
                            t.p.afterInsertRow.call(t, rowid, data, data)
                        }
                        k++;
                        if (t.p.datatype === "local") {
                            lcdata[t.p.localReader.id] = id;
                            t.p._index[id] = t.p.data.length;
                            t.p.data.push(lcdata);
                            lcdata = {}
                        }
                    }
                    if (t.p.altRows === true && !aradd) {
                        if (pos === "last") {
                            if ((t.rows.length - 1) % 2 === 0) {
                                $(t.rows[t.rows.length - 1]).addClass(cn)
                            }
                        } else {
                            $(t.rows).each(function(i) {
                                if (i % 2 === 1) {
                                    $(this).addClass(cn)
                                } else {
                                    $(this).removeClass(cn)
                                }
                            })
                        }
                    }
                    t.updatepager(true, true);
                    success = true
                })
            }
            return success
        },
        footerData: function(action, data, format) {
            var nm, success = false,
            res = {},
            title;
            function isEmpty(obj) {
                var i;
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        return false
                    }
                }
                return true
            }
            if (action == undefined) {
                action = "get"
            }
            if (typeof format !== "boolean") {
                format = true
            }
            action = action.toLowerCase();
            this.each(function() {
                var t = this,
                vl;
                if (!t.grid || !t.p.footerrow) {
                    return false
                }
                if (action === "set") {
                    if (isEmpty(data)) {
                        return false
                    }
                }
                success = true;
                $(this.p.colModel).each(function(i) {
                    nm = this.name;
                    if (action === "set") {
                        if (data[nm] !== undefined) {
                            vl = format ? t.formatter("", data[nm], i, data, "edit") : data[nm];
                            title = this.title ? {
                                title: $.jgrid.stripHtml(vl)
                            }: {};
                            $("tr.footrow td:eq(" + i + ")", t.grid.sDiv).html(vl).attr(title);
                            $("tr.footrow td:eq(" + i + ")", t.grid.fsDiv).html(vl).attr(title);
                            success = true
                        }
                    } else {
                        if (action === "get") {
                            res[nm] = $("tr.footrow td:eq(" + i + ")", t.grid.sDiv).html()
                        }
                    }
                })
            });
            return action === "get" ? res: success
        },
        showHideCol: function(colname, show) {
            return this.each(function() {
                var $t = this,
                fndh = false,
                brd = $.jgrid.cell_width ? 0 : $t.p.cellLayout,
                cw;
                if (!$t.grid) {
                    return
                }
                if (typeof colname === "string") {
                    colname = [colname]
                }
                show = show !== "none" ? "": "none";
                var sw = show === "" ? true: false,
                gh = $t.p.groupHeader && (typeof $t.p.groupHeader === "object" || $.isFunction($t.p.groupHeader));
                if (gh) {
                    $($t).jqGrid("destroyGroupHeader", false)
                }
                $(this.p.colModel).each(function(i) {
                    if ($.inArray(this.name, colname) !== -1 && this.hidden === sw) {
                        if ($t.p.frozenColumns === true && this.frozen === true) {
                            return true
                        }
                        $("tr[role=row]", $t.grid.hDiv).each(function() {
                            $(this.cells[i]).css("display", show)
                        });
                        $($t.rows).each(function() {
                            if (!$(this).hasClass("jqgroup")) {
                                $(this.cells[i]).css("display", show)
                            }
                        });
                        if ($t.p.footerrow) {
                            $("tr.footrow td:eq(" + i + ")", $t.grid.sDiv).css("display", show)
                        }
                        cw = parseInt(this.width, 10);
                        if (show === "none") {
                            $t.p.tblwidth -= cw + brd
                        } else {
                            $t.p.tblwidth += cw + brd
                        }
                        this.hidden = !sw;
                        fndh = true;
                        $($t).triggerHandler("jqGridShowHideCol", [sw, this.name, i])
                    }
                });
                if (fndh === true) {
                    if ($t.p.shrinkToFit === true && !isNaN($t.p.height)) {
                        $t.p.tblwidth += parseInt($t.p.scrollOffset, 10)
                    }
                    $($t).jqGrid("setGridWidth", $t.p.shrinkToFit === true ? $t.p.tblwidth: $t.p.width)
                }
                if (gh) {
                    $($t).jqGrid("setGroupHeaders", $t.p.groupHeader)
                }
            })
        },
        hideCol: function(colname) {
            return this.each(function() {
                $(this).jqGrid("showHideCol", colname, "none")
            })
        },
        showCol: function(colname) {
            return this.each(function() {
                $(this).jqGrid("showHideCol", colname, "")
            })
        },
        remapColumns: function(permutation, updateCells, keepHeader) {
            function resortArray(a) {
                var ac;
                if (a.length) {
                    ac = $.makeArray(a)
                } else {
                    ac = $.extend({},
                    a)
                }
                $.each(permutation,
                function(i) {
                    a[i] = ac[this]
                })
            }
            var ts = this.get(0);
            function resortRows(parent, clobj) {
                $(">tr" + (clobj || ""), parent).each(function() {
                    var row = this;
                    var elems = $.makeArray(row.cells);
                    $.each(permutation,
                    function() {
                        var e = elems[this];
                        if (e) {
                            row.appendChild(e)
                        }
                    })
                })
            }
            resortArray(ts.p.colModel);
            resortArray(ts.p.colNames);
            resortArray(ts.grid.headers);
            resortRows($("thead:first", ts.grid.hDiv), keepHeader && ":not(.ui-jqgrid-labels)");
            if (updateCells) {
                resortRows($("#" + $.jgrid.jqID(ts.p.id) + " tbody:first"), ".jqgfirstrow, tr.jqgrow, tr.jqfoot")
            }
            if (ts.p.footerrow) {
                resortRows($("tbody:first", ts.grid.sDiv))
            }
            if (ts.p.remapColumns) {
                if (!ts.p.remapColumns.length) {
                    ts.p.remapColumns = $.makeArray(permutation)
                } else {
                    resortArray(ts.p.remapColumns)
                }
            }
            ts.p.lastsort = $.inArray(ts.p.lastsort, permutation);
            if (ts.p.treeGrid) {
                ts.p.expColInd = $.inArray(ts.p.expColInd, permutation)
            }
            $(ts).triggerHandler("jqGridRemapColumns", [permutation, updateCells, keepHeader])
        },
        setGridWidth: function(nwidth, shrink) {
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var $t = this,
                cw, initwidth = 0,
                brd = $.jgrid.cell_width ? 0 : $t.p.cellLayout,
                lvc,
                vc = 0,
                hs = false,
                scw = $t.p.scrollOffset,
                aw,
                gw = 0,
                cr;
                if (typeof shrink !== "boolean") {
                    shrink = $t.p.shrinkToFit
                }
                if (isNaN(nwidth)) {
                    return
                }
                nwidth = parseInt(nwidth, 10);
                $t.grid.width = $t.p.width = nwidth;
                $("#gbox_" + $.jgrid.jqID($t.p.id)).css("width", (nwidth + 2) + "px");
                $("#gview_" + $.jgrid.jqID($t.p.id)).css("width", nwidth + "px");
                $($t.grid.bDiv).css("width", nwidth + "px");
                $($t.grid.hDiv).css("width", nwidth + "px");
                if ($t.p.pager) {
                    $($t.p.pager).css("width", nwidth + "px")
                }
                if ($t.p.toppager) {
                    $($t.p.toppager).css("width", nwidth + "px")
                }
                if ($t.p.toolbar[0] === true) {
                    $($t.grid.uDiv).css("width", nwidth + "px");
                    if ($t.p.toolbar[1] === "both") {
                        $($t.grid.ubDiv).css("width", nwidth + "px")
                    }
                }
                if ($t.p.footerrow) {
                    $($t.grid.sDiv).css("width", nwidth + "px")
                }
                if (shrink === false && $t.p.forceFit === true) {
                    $t.p.forceFit = false
                }
                if (shrink === true) {
                    $.each($t.p.colModel,
                    function() {
                        if (this.hidden === false) {
                            cw = this.widthOrg;
                            initwidth += cw + brd;
                            if (this.fixed) {
                                gw += cw + brd
                            } else {
                                vc++
                            }
                        }
                    });
                    if (vc === 0) {
                        return
                    }
                    $t.p.tblwidth = initwidth;
                    aw = nwidth - brd * vc - gw;
                    if (!isNaN($t.p.height)) {
                        if ($($t.grid.bDiv)[0].clientHeight < $($t.grid.bDiv)[0].scrollHeight || $t.rows.length === 1) {
                            hs = true;
                            aw -= scw
                        }
                    }
                    initwidth = 0;
                    var cle = $t.grid.cols.length > 0;
                    $.each($t.p.colModel,
                    function(i) {
                        if (this.hidden === false && !this.fixed) {
                            cw = this.widthOrg;
                            cw = Math.round(aw * cw / ($t.p.tblwidth - brd * vc - gw));
                            if (cw < 0) {
                                return
                            }
                            this.width = cw;
                            initwidth += cw;
                            $t.grid.headers[i].width = cw;
                            $t.grid.headers[i].el.style.width = cw + "px";
                            if ($t.p.footerrow) {
                                $t.grid.footers[i].style.width = cw + "px"
                            }
                            if (cle) {
                                $t.grid.cols[i].style.width = cw + "px"
                            }
                            lvc = i
                        }
                    });
                    if (!lvc) {
                        return
                    }
                    cr = 0;
                    if (hs) {
                        if (nwidth - gw - (initwidth + brd * vc) !== scw) {
                            cr = nwidth - gw - (initwidth + brd * vc) - scw
                        }
                    } else {
                        if (Math.abs(nwidth - gw - (initwidth + brd * vc)) !== 1) {
                            cr = nwidth - gw - (initwidth + brd * vc)
                        }
                    }
                    $t.p.colModel[lvc].width += cr;
                    $t.p.tblwidth = initwidth + cr + brd * vc + gw;
                    if ($t.p.tblwidth > nwidth) {
                        var delta = $t.p.tblwidth - parseInt(nwidth, 10);
                        $t.p.tblwidth = nwidth;
                        cw = $t.p.colModel[lvc].width = $t.p.colModel[lvc].width - delta
                    } else {
                        cw = $t.p.colModel[lvc].width
                    }
                    $t.grid.headers[lvc].width = cw;
                    $t.grid.headers[lvc].el.style.width = cw + "px";
                    if (cle) {
                        $t.grid.cols[lvc].style.width = cw + "px"
                    }
                    if ($t.p.footerrow) {
                        $t.grid.footers[lvc].style.width = cw + "px"
                    }
                }
                if ($t.p.tblwidth) {
                    $("table:first", $t.grid.bDiv).css("width", $t.p.tblwidth + "px");
                    $("table:first", $t.grid.hDiv).css("width", $t.p.tblwidth + "px");
                    $t.grid.hDiv.scrollLeft = $t.grid.bDiv.scrollLeft;
                    if ($t.p.footerrow) {
                        $("table:first", $t.grid.sDiv).css("width", $t.p.tblwidth + "px")
                    }
                }
            })
        },
        setGridHeight: function(nh) {
            return this.each(function() {
                var $t = this;
                if (!$t.grid) {
                    return
                }
                var bDiv = $($t.grid.bDiv);
                bDiv.css({
                    height: nh + (isNaN(nh) ? "": "px")
                });
                if ($t.p.frozenColumns === true) {
                    $("#" + $.jgrid.jqID($t.p.id) + "_frozen").parent().height(bDiv.height() - 16 + ($.jgrid.msie || $.jgrid.msie11 ? 0 : 4))
                }
                $t.p.height = nh;
                if ($t.p.scroll) {
                    $t.grid.populateVisible()
                }
            })
        },
        setCaption: function(newcap) {
            return this.each(function() {
                this.p.caption = newcap;
                $("span.ui-jqgrid-title, span.ui-jqgrid-title-rtl", this.grid.cDiv).html(newcap);
                $(this.grid.cDiv).show();
                $(this.grid.hDiv).removeClass("ui-corner-top")
            })
        },
        setLabel: function(colname, nData, prop, attrp) {
            return this.each(function() {
                var $t = this,
                pos = -1;
                if (!$t.grid) {
                    return
                }
                if (colname !== undefined) {
                    $($t.p.colModel).each(function(i) {
                        if (this.name === colname) {
                            pos = i;
                            return false
                        }
                    })
                } else {
                    return
                }
                if (pos >= 0) {
                    var thecol = $("tr.ui-jqgrid-labels th:eq(" + pos + ")", $t.grid.hDiv);
                    if (nData) {
                        var ico = $(".s-ico", thecol);
                        $("[id^=jqgh_]", thecol).empty().html(nData).append(ico);
                        $t.p.colNames[pos] = nData
                    }
                    if (prop) {
                        if (typeof prop === "string") {
                            $(thecol).addClass(prop)
                        } else {
                            $(thecol).css(prop)
                        }
                    }
                    if (typeof attrp === "object") {
                        $(thecol).attr(attrp)
                    }
                }
            })
        },
        setCell: function(rowid, colname, nData, cssp, attrp, forceupd) {
            return this.each(function() {
                var $t = this,
                pos = -1,
                v, title;
                if (!$t.grid) {
                    return
                }
                if (isNaN(colname)) {
                    $($t.p.colModel).each(function(i) {
                        if (this.name === colname) {
                            pos = i;
                            return false
                        }
                    })
                } else {
                    pos = parseInt(colname, 10)
                }
                if (pos >= 0) {
                    var ind = $($t).jqGrid("getGridRowById", rowid);
                    if (ind) {
                        var tcell = $("td:eq(" + pos + ")", ind),
                        cl = 0,
                        rawdat = [];
                        if (nData !== "" || forceupd === true) {
                            while (cl < ind.cells.length) {
                                rawdat.push(ind.cells[cl].innerHTML);
                                cl++
                            }
                            v = $t.formatter(rowid, nData, pos, rawdat, "edit");
                            title = $t.p.colModel[pos].title ? {
                                title: $.jgrid.stripHtml(v)
                            }: {};
                            if ($t.p.treeGrid && $(".tree-wrap", $(tcell)).length > 0) {
                                $("span", $(tcell)).html(v).attr(title)
                            } else {
                                $(tcell).html(v).attr(title)
                            }
                            if ($t.p.datatype === "local") {
                                var cm = $t.p.colModel[pos],
                                index;
                                nData = cm.formatter && typeof cm.formatter === "string" && cm.formatter === "date" ? $.unformat.date.call($t, nData, cm) : nData;
                                index = $t.p._index[$.jgrid.stripPref($t.p.idPrefix, rowid)];
                                if (index !== undefined) {
                                    $t.p.data[index][cm.name] = nData
                                }
                            }
                        }
                        if (typeof cssp === "string") {
                            $(tcell).addClass(cssp)
                        } else {
                            if (cssp) {
                                $(tcell).css(cssp)
                            }
                        }
                        if (typeof attrp === "object") {
                            $(tcell).attr(attrp)
                        }
                    }
                }
            })
        },
        getCell: function(rowid, col) {
            var ret = false;
            this.each(function() {
                var $t = this,
                pos = -1;
                if (!$t.grid) {
                    return
                }
                if (isNaN(col)) {
                    $($t.p.colModel).each(function(i) {
                        if (this.name === col) {
                            pos = i;
                            return false
                        }
                    })
                } else {
                    pos = parseInt(col, 10)
                }
                if (pos >= 0) {
                    var ind = $($t).jqGrid("getGridRowById", rowid);
                    if (ind) {
                        try {
                            ret = $.unformat.call($t, $("td:eq(" + pos + ")", ind), {
                                rowId: ind.id,
                                colModel: $t.p.colModel[pos]
                            },
                            pos)
                        } catch(e) {
                            ret = $.jgrid.htmlDecode($("td:eq(" + pos + ")", ind).html())
                        }
                    }
                }
            });
            return ret
        },
        getCol: function(col, obj, mathopr) {
            var ret = [],
            val,
            sum = 0,
            min,
            max,
            v;
            obj = typeof obj !== "boolean" ? false: obj;
            if (mathopr === undefined) {
                mathopr = false
            }
            this.each(function() {
                var $t = this,
                pos = -1;
                if (!$t.grid) {
                    return
                }
                if (isNaN(col)) {
                    $($t.p.colModel).each(function(i) {
                        if (this.name === col) {
                            pos = i;
                            return false
                        }
                    })
                } else {
                    pos = parseInt(col, 10)
                }
                if (pos >= 0) {
                    var ln = $t.rows.length,
                    i = 0,
                    dlen = 0;
                    if (ln && ln > 0) {
                        while (i < ln) {
                            if ($($t.rows[i]).hasClass("jqgrow")) {
                                try {
                                    val = $.unformat.call($t, $($t.rows[i].cells[pos]), {
                                        rowId: $t.rows[i].id,
                                        colModel: $t.p.colModel[pos]
                                    },
                                    pos)
                                } catch(e) {
                                    val = $.jgrid.htmlDecode($t.rows[i].cells[pos].innerHTML)
                                }
                                if (mathopr) {
                                    v = parseFloat(val);
                                    if (!isNaN(v)) {
                                        sum += v;
                                        if (max === undefined) {
                                            max = min = v
                                        }
                                        min = Math.min(min, v);
                                        max = Math.max(max, v);
                                        dlen++
                                    }
                                } else {
                                    if (obj) {
                                        ret.push({
                                            id: $t.rows[i].id,
                                            value: val
                                        })
                                    } else {
                                        ret.push(val)
                                    }
                                }
                            }
                            i++
                        }
                        if (mathopr) {
                            switch (mathopr.toLowerCase()) {
                            case "sum":
                                ret = sum;
                                break;
                            case "avg":
                                ret = sum / dlen;
                                break;
                            case "count":
                                ret = (ln - 1);
                                break;
                            case "min":
                                ret = min;
                                break;
                            case "max":
                                ret = max;
                                break
                            }
                        }
                    }
                }
            });
            return ret
        },
        clearGridData: function(clearfooter) {
            return this.each(function() {
                var $t = this;
                if (!$t.grid) {
                    return
                }
                if (typeof clearfooter !== "boolean") {
                    clearfooter = false
                }
                if ($t.p.deepempty) {
                    $("#" + $.jgrid.jqID($t.p.id) + " tbody:first tr:gt(0)").remove()
                } else {
                    var trf = $("#" + $.jgrid.jqID($t.p.id) + " tbody:first tr:first")[0];
                    $("#" + $.jgrid.jqID($t.p.id) + " tbody:first").empty().append(trf)
                }
                if ($t.p.footerrow && clearfooter) {
                    $(".ui-jqgrid-ftable td", $t.grid.sDiv).html("&#160;")
                }
                $t.p.selrow = null;
                $t.p.selarrrow = [];
                $t.p.savedRow = [];
                $t.p.records = 0;
                $t.p.page = 1;
                $t.p.lastpage = 0;
                $t.p.reccount = 0;
                $t.p.data = [];
                $t.p._index = {};
                $t.updatepager(true, false)
            })
        },
        getInd: function(rowid, rc) {
            var ret = false,
            rw;
            this.each(function() {
                rw = $(this).jqGrid("getGridRowById", rowid);
                if (rw) {
                    ret = rc === true ? rw: rw.rowIndex
                }
            });
            return ret
        },
        bindKeys: function(settings) {
            var o = $.extend({
                onEnter: null,
                onSpace: null,
                onLeftKey: null,
                onRightKey: null,
                scrollingRows: true
            },
            settings || {});
            return this.each(function() {
                var $t = this;
                if (!$("body").is("[role]")) {
                    $("body").attr("role", "application")
                }
                $t.p.scrollrows = o.scrollingRows;
                $($t).keydown(function(event) {
                    var target = $($t).find("tr[tabindex=0]")[0],
                    id,
                    r,
                    mind,
                    expanded = $t.p.treeReader.expanded_field;
                    if (target) {
                        mind = $t.p._index[$.jgrid.stripPref($t.p.idPrefix, target.id)];
                        if (event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
                            if (event.keyCode === 38) {
                                r = target.previousSibling;
                                id = "";
                                if (r) {
                                    if ($(r).is(":hidden")) {
                                        while (r) {
                                            r = r.previousSibling;
                                            if (!$(r).is(":hidden") && $(r).hasClass("jqgrow")) {
                                                id = r.id;
                                                break
                                            }
                                        }
                                    } else {
                                        id = r.id
                                    }
                                }
                                $($t).jqGrid("setSelection", id, true, event);
                                event.preventDefault()
                            }
                            if (event.keyCode === 40) {
                                r = target.nextSibling;
                                id = "";
                                if (r) {
                                    if ($(r).is(":hidden")) {
                                        while (r) {
                                            r = r.nextSibling;
                                            if (!$(r).is(":hidden") && $(r).hasClass("jqgrow")) {
                                                id = r.id;
                                                break
                                            }
                                        }
                                    } else {
                                        id = r.id
                                    }
                                }
                                $($t).jqGrid("setSelection", id, true, event);
                                event.preventDefault()
                            }
                            if (event.keyCode === 37) {
                                if ($t.p.treeGrid && $t.p.data[mind][expanded]) {
                                    $(target).find("div.treeclick").trigger("click")
                                }
                                $($t).triggerHandler("jqGridKeyLeft", [$t.p.selrow]);
                                if ($.isFunction(o.onLeftKey)) {
                                    o.onLeftKey.call($t, $t.p.selrow)
                                }
                            }
                            if (event.keyCode === 39) {
                                if ($t.p.treeGrid && !$t.p.data[mind][expanded]) {
                                    $(target).find("div.treeclick").trigger("click")
                                }
                                $($t).triggerHandler("jqGridKeyRight", [$t.p.selrow]);
                                if ($.isFunction(o.onRightKey)) {
                                    o.onRightKey.call($t, $t.p.selrow)
                                }
                            }
                        } else {
                            if (event.keyCode === 13) {
                                $($t).triggerHandler("jqGridKeyEnter", [$t.p.selrow]);
                                if ($.isFunction(o.onEnter)) {
                                    o.onEnter.call($t, $t.p.selrow)
                                }
                            } else {
                                if (event.keyCode === 32) {
                                    $($t).triggerHandler("jqGridKeySpace", [$t.p.selrow]);
                                    if ($.isFunction(o.onSpace)) {
                                        o.onSpace.call($t, $t.p.selrow)
                                    }
                                }
                            }
                        }
                    }
                })
            })
        },
        unbindKeys: function() {
            return this.each(function() {
                $(this).unbind("keydown")
            })
        },
        getLocalRow: function(rowid) {
            var ret = false,
            ind;
            this.each(function() {
                if (rowid !== undefined) {
                    ind = this.p._index[$.jgrid.stripPref(this.p.idPrefix, rowid)];
                    if (ind >= 0) {
                        ret = this.p.data[ind]
                    }
                }
            });
            return ret
        },
        progressBar: function(p) {
            p = $.extend({
                htmlcontent: "",
                method: "hide",
                loadtype: "disable"
            },
            p || {});
            return this.each(function() {
                var sh = p.method === "show" ? true: false;
                if (p.htmlcontent !== "") {
                    $("#load_" + $.jgrid.jqID(this.p.id)).html(p.htmlcontent)
                }
                switch (p.loadtype) {
                case "disable":
                    break;
                case "enable":
                    $("#load_" + $.jgrid.jqID(this.p.id)).toggle(sh);
                    break;
                case "block":
                    $("#lui_" + $.jgrid.jqID(this.p.id)).toggle(sh);
                    $("#load_" + $.jgrid.jqID(this.p.id)).toggle(sh);
                    break
                }
            })
        }
    })
})(jQuery); (function(a) {
    a.jgrid.extend({
        editCell: function(d, c, b) {
            return this.each(function() {
                var i = this,
                m, j, g, k;
                if (!i.grid || i.p.cellEdit !== true) {
                    return
                }
                c = parseInt(c, 10);
                i.p.selrow = i.rows[d].id;
                if (!i.p.knv) {
                    a(i).jqGrid("GridNav")
                }
                if (i.p.savedRow.length > 0) {
                    if (b === true) {
                        if (d == i.p.iRow && c == i.p.iCol) {
                            return
                        }
                    }
                    a(i).jqGrid("saveCell", i.p.savedRow[0].id, i.p.savedRow[0].ic)
                } else {
                    window.setTimeout(function() {
                        a("#" + a.jgrid.jqID(i.p.knv)).attr("tabindex", "-1").focus()
                    },
                    1)
                }
                k = i.p.colModel[c];
                m = k.name;
                if (m === "subgrid" || m === "cb" || m === "rn") {
                    return
                }
                g = a("td:eq(" + c + ")", i.rows[d]);
                if (k.editable === true && b === true && !g.hasClass("not-editable-cell")) {
                    if (parseInt(i.p.iCol, 10) >= 0 && parseInt(i.p.iRow, 10) >= 0) {
                        a("td:eq(" + i.p.iCol + ")", i.rows[i.p.iRow]).removeClass("edit-cell ui-state-highlight");
                        a(i.rows[i.p.iRow]).removeClass("selected-row ui-state-hover")
                    }
                    a(g).addClass("edit-cell ui-state-highlight");
                    a(i.rows[d]).addClass("selected-row ui-state-hover");
                    try {
                        j = a.unformat.call(i, g, {
                            rowId: i.rows[d].id,
                            colModel: k
                        },
                        c)
                    } catch(l) {
                        j = (k.edittype && k.edittype === "textarea") ? a(g).text() : a(g).html()
                    }
                    if (i.p.autoencode) {
                        j = a.jgrid.htmlDecode(j)
                    }
                    if (!k.edittype) {
                        k.edittype = "text"
                    }
                    i.p.savedRow.push({
                        id: d,
                        ic: c,
                        name: m,
                        v: j
                    });
                    if (j === "&nbsp;" || j === "&#160;" || (j.length === 1 && j.charCodeAt(0) === 160)) {
                        j = ""
                    }
                    if (a.isFunction(i.p.formatCell)) {
                        var h = i.p.formatCell.call(i, i.rows[d].id, m, j, d, c);
                        if (h !== undefined) {
                            j = h
                        }
                    }
                    a(i).triggerHandler("jqGridBeforeEditCell", [i.rows[d].id, m, j, d, c]);
                    if (a.isFunction(i.p.beforeEditCell)) {
                        i.p.beforeEditCell.call(i, i.rows[d].id, m, j, d, c)
                    }
                    var f = a.extend({},
                    k.editoptions || {},
                    {
                        id: d + "_" + m,
                        name: m,
                        rowId: i.rows[d].id
                    });
                    var e = a.jgrid.createEl.call(i, k.edittype, f, j, true, a.extend({},
                    a.jgrid.ajaxOptions, i.p.ajaxSelectOptions || {}));
                    a(g).html("").append(e).attr("tabindex", "0");
                    a.jgrid.bindEv.call(i, e, f);
                    window.setTimeout(function() {
                        a(e).focus()
                    },
                    1);
                    a("input, select, textarea", g).bind("keydown",
                    function(n) {
                        if (n.keyCode === 27) {
                            if (a("input.hasDatepicker", g).length > 0) {
                                if (a(".ui-datepicker").is(":hidden")) {
                                    a(i).jqGrid("restoreCell", d, c)
                                } else {
                                    a("input.hasDatepicker", g).datepicker("hide")
                                }
                            } else {
                                a(i).jqGrid("restoreCell", d, c)
                            }
                        }
                        if (n.keyCode === 13 && !n.shiftKey) {
                            a(i).jqGrid("saveCell", d, c);
                            return false
                        }
                        if (n.keyCode === 9) {
                            if (!i.grid.hDiv.loading) {
                                if (n.shiftKey) {
                                    a(i).jqGrid("prevCell", d, c)
                                } else {
                                    a(i).jqGrid("nextCell", d, c)
                                }
                            } else {
                                return false
                            }
                        }
                        n.stopPropagation()
                    });
                    a(i).triggerHandler("jqGridAfterEditCell", [i.rows[d].id, m, j, d, c]);
                    if (a.isFunction(i.p.afterEditCell)) {
                        i.p.afterEditCell.call(i, i.rows[d].id, m, j, d, c)
                    }
                } else {
                    if (parseInt(i.p.iCol, 10) >= 0 && parseInt(i.p.iRow, 10) >= 0) {
                        a("td:eq(" + i.p.iCol + ")", i.rows[i.p.iRow]).removeClass("edit-cell ui-state-highlight");
                        a(i.rows[i.p.iRow]).removeClass("selected-row ui-state-hover")
                    }
                    g.addClass("edit-cell ui-state-highlight");
                    a(i.rows[d]).addClass("selected-row ui-state-hover");
                    j = g.html().replace(/\&#160\;/ig, "");
                    a(i).triggerHandler("jqGridSelectCell", [i.rows[d].id, m, j, d, c]);
                    if (a.isFunction(i.p.onSelectCell)) {
                        i.p.onSelectCell.call(i, i.rows[d].id, m, j, d, c)
                    }
                }
                i.p.iCol = c;
                i.p.iRow = d
            })
        },
        saveCell: function(c, b) {
            return this.each(function() {
                var u = this,
                h;
                if (!u.grid || u.p.cellEdit !== true) {
                    return
                }
                if (u.p.savedRow.length >= 1) {
                    h = 0
                } else {
                    h = null
                }
                if (h !== null) {
                    var p = a("td:eq(" + b + ")", u.rows[c]),
                    n,
                    d,
                    j = u.p.colModel[b],
                    f = j.name,
                    i = a.jgrid.jqID(f);
                    switch (j.edittype) {
                    case "select":
                        if (!j.editoptions.multiple) {
                            n = a("#" + c + "_" + i + " option:selected", u.rows[c]).val();
                            d = a("#" + c + "_" + i + " option:selected", u.rows[c]).text()
                        } else {
                            var t = a("#" + c + "_" + i, u.rows[c]),
                            s = [];
                            n = a(t).val();
                            if (n) {
                                n.join(",")
                            } else {
                                n = ""
                            }
                            a("option:selected", t).each(function(e, v) {
                                s[e] = a(v).text()
                            });
                            d = s.join(",")
                        }
                        if (j.formatter) {
                            d = n
                        }
                        break;
                    case "checkbox":
                        var q = ["Yes", "No"];
                        if (j.editoptions) {
                            q = j.editoptions.value.split(":")
                        }
                        n = a("#" + c + "_" + i, u.rows[c]).is(":checked") ? q[0] : q[1];
                        d = n;
                        break;
                    case "password":
                    case "text":
                    case "textarea":
                    case "button":
                        n = a("#" + c + "_" + i, u.rows[c]).val();
                        d = n;
                        break;
                    case "custom":
                        try {
                            if (j.editoptions && a.isFunction(j.editoptions.custom_value)) {
                                n = j.editoptions.custom_value.call(u, a(".customelement", p), "get");
                                if (n === undefined) {
                                    throw "e2"
                                } else {
                                    d = n
                                }
                            } else {
                                throw "e1"
                            }
                        } catch(w) {
                            if (w === "e1") {
                                a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_value' " + a.jgrid.edit.msg.nodefined, a.jgrid.edit.bClose)
                            }
                            if (w === "e2") {
                                a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_value' " + a.jgrid.edit.msg.novalue, a.jgrid.edit.bClose)
                            } else {
                                a.jgrid.info_dialog(a.jgrid.errors.errcap, w.message, a.jgrid.edit.bClose)
                            }
                        }
                        break
                    }
                    if (d !== u.p.savedRow[h].v) {
                        var y = a(u).triggerHandler("jqGridBeforeSaveCell", [u.rows[c].id, f, n, c, b]);
                        if (y) {
                            n = y;
                            d = y
                        }
                        if (a.isFunction(u.p.beforeSaveCell)) {
                            var r = u.p.beforeSaveCell.call(u, u.rows[c].id, f, n, c, b);
                            if (r) {
                                n = r;
                                d = r
                            }
                        }
                        var g = a.jgrid.checkValues.call(u, n, b);
                        if (g[0] === true) {
                            var l = a(u).triggerHandler("jqGridBeforeSubmitCell", [u.rows[c].id, f, n, c, b]) || {};
                            if (a.isFunction(u.p.beforeSubmitCell)) {
                                l = u.p.beforeSubmitCell.call(u, u.rows[c].id, f, n, c, b);
                                if (!l) {
                                    l = {}
                                }
                            }
                            if (a("input.hasDatepicker", p).length > 0) {
                                a("input.hasDatepicker", p).datepicker("hide")
                            }
                            if (u.p.cellsubmit === "remote") {
                                if (u.p.cellurl) {
                                    var x = {};
                                    if (u.p.autoencode) {
                                        n = a.jgrid.htmlEncode(n)
                                    }
                                    x[f] = n;
                                    var o, m, k;
                                    k = u.p.prmNames;
                                    o = k.id;
                                    m = k.oper;
                                    x[o] = a.jgrid.stripPref(u.p.idPrefix, u.rows[c].id);
                                    x[m] = k.editoper;
                                    x = a.extend(l, x);
                                    a(u).jqGrid("progressBar", {
                                        method: "show",
                                        loadtype: u.p.loadui,
                                        htmlcontent: a.jgrid.defaults.savetext || "Saving..."
                                    });
                                    u.grid.hDiv.loading = true;
                                    a.ajax(a.extend({
                                        url: u.p.cellurl,
                                        data: a.isFunction(u.p.serializeCellData) ? u.p.serializeCellData.call(u, x) : x,
                                        type: "POST",
                                        complete: function(e, z) {
                                            a(u).jqGrid("progressBar", {
                                                method: "hide",
                                                loadtype: u.p.loadui
                                            });
                                            u.grid.hDiv.loading = false;
                                            if (z === "success") {
                                                var v = a(u).triggerHandler("jqGridAfterSubmitCell", [u, e, x.id, f, n, c, b]) || [true, ""];
                                                if (v[0] === true && a.isFunction(u.p.afterSubmitCell)) {
                                                    v = u.p.afterSubmitCell.call(u, e, x.id, f, n, c, b)
                                                }
                                                if (v[0] === true) {
                                                    a(p).empty();
                                                    a(u).jqGrid("setCell", u.rows[c].id, b, d, false, false, true);
                                                    a(p).addClass("dirty-cell");
                                                    a(u.rows[c]).addClass("edited");
                                                    a(u).triggerHandler("jqGridAfterSaveCell", [u.rows[c].id, f, n, c, b]);
                                                    if (a.isFunction(u.p.afterSaveCell)) {
                                                        u.p.afterSaveCell.call(u, u.rows[c].id, f, n, c, b)
                                                    }
                                                    u.p.savedRow.splice(0, 1)
                                                } else {
                                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, v[1], a.jgrid.edit.bClose);
                                                    a(u).jqGrid("restoreCell", c, b)
                                                }
                                            }
                                        },
                                        error: function(e, v, z) {
                                            a("#lui_" + a.jgrid.jqID(u.p.id)).hide();
                                            u.grid.hDiv.loading = false;
                                            a(u).triggerHandler("jqGridErrorCell", [e, v, z]);
                                            if (a.isFunction(u.p.errorCell)) {
                                                u.p.errorCell.call(u, e, v, z);
                                                a(u).jqGrid("restoreCell", c, b)
                                            } else {
                                                a.jgrid.info_dialog(a.jgrid.errors.errcap, e.status + " : " + e.statusText + "<br/>" + v, a.jgrid.edit.bClose);
                                                a(u).jqGrid("restoreCell", c, b)
                                            }
                                        }
                                    },
                                    a.jgrid.ajaxOptions, u.p.ajaxCellOptions || {}))
                                } else {
                                    try {
                                        a.jgrid.info_dialog(a.jgrid.errors.errcap, a.jgrid.errors.nourl, a.jgrid.edit.bClose);
                                        a(u).jqGrid("restoreCell", c, b)
                                    } catch(w) {}
                                }
                            }
                            if (u.p.cellsubmit === "clientArray") {
                                a(p).empty();
                                a(u).jqGrid("setCell", u.rows[c].id, b, d, false, false, true);
                                a(p).addClass("dirty-cell");
                                a(u.rows[c]).addClass("edited");
                                a(u).triggerHandler("jqGridAfterSaveCell", [u.rows[c].id, f, n, c, b]);
                                if (a.isFunction(u.p.afterSaveCell)) {
                                    u.p.afterSaveCell.call(u, u.rows[c].id, f, n, c, b)
                                }
                                u.p.savedRow.splice(0, 1)
                            }
                        } else {
                            try {
                                window.setTimeout(function() {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, n + " " + g[1], a.jgrid.edit.bClose)
                                },
                                100);
                                a(u).jqGrid("restoreCell", c, b)
                            } catch(w) {}
                        }
                    } else {
                        a(u).jqGrid("restoreCell", c, b)
                    }
                }
                window.setTimeout(function() {
                    a("#" + a.jgrid.jqID(u.p.knv)).attr("tabindex", "-1").focus()
                },
                0)
            })
        },
        restoreCell: function(c, b) {
            return this.each(function() {
                var h = this,
                d;
                if (!h.grid || h.p.cellEdit !== true) {
                    return
                }
                if (h.p.savedRow.length >= 1) {
                    d = 0
                } else {
                    d = null
                }
                if (d !== null) {
                    var g = a("td:eq(" + b + ")", h.rows[c]);
                    if (a.isFunction(a.fn.datepicker)) {
                        try {
                            a("input.hasDatepicker", g).datepicker("hide")
                        } catch(f) {}
                    }
                    a(g).empty().attr("tabindex", "-1");
                    a(h).jqGrid("setCell", h.rows[c].id, b, h.p.savedRow[d].v, false, false, true);
                    a(h).triggerHandler("jqGridAfterRestoreCell", [h.rows[c].id, h.p.savedRow[d].v, c, b]);
                    if (a.isFunction(h.p.afterRestoreCell)) {
                        h.p.afterRestoreCell.call(h, h.rows[c].id, h.p.savedRow[d].v, c, b)
                    }
                    h.p.savedRow.splice(0, 1)
                }
                window.setTimeout(function() {
                    a("#" + h.p.knv).attr("tabindex", "-1").focus()
                },
                0)
            })
        },
        nextCell: function(c, b) {
            return this.each(function() {
                var f = this,
                e = false,
                d;
                if (!f.grid || f.p.cellEdit !== true) {
                    return
                }
                for (d = b + 1; d < f.p.colModel.length; d++) {
                    if (f.p.colModel[d].editable === true) {
                        e = d;
                        break
                    }
                }
                if (e !== false) {
                    a(f).jqGrid("editCell", c, e, true)
                } else {
                    if (f.p.savedRow.length > 0) {
                        a(f).jqGrid("saveCell", c, b)
                    }
                }
            })
        },
        prevCell: function(c, b) {
            return this.each(function() {
                var f = this,
                e = false,
                d;
                if (!f.grid || f.p.cellEdit !== true) {
                    return
                }
                for (d = b - 1; d >= 0; d--) {
                    if (f.p.colModel[d].editable === true) {
                        e = d;
                        break
                    }
                }
                if (e !== false) {
                    a(f).jqGrid("editCell", c, e, true)
                } else {
                    if (f.p.savedRow.length > 0) {
                        a(f).jqGrid("saveCell", c, b)
                    }
                }
            })
        },
        GridNav: function() {
            return this.each(function() {
                var g = this;
                if (!g.grid || g.p.cellEdit !== true) {
                    return
                }
                g.p.knv = g.p.id + "_kn";
                var f = a("<div style='position:fixed;top:0px;width:1px;height:1px;' tabindex='0'><div tabindex='-1' style='width:1px;height:1px;' id='" + g.p.knv + "'></div></div>"),
                d,
                c;
                function e(p, n, o) {
                    if (o.substr(0, 1) === "v") {
                        var h = a(g.grid.bDiv)[0].clientHeight,
                        q = a(g.grid.bDiv)[0].scrollTop,
                        r = g.rows[p].offsetTop + g.rows[p].clientHeight,
                        l = g.rows[p].offsetTop;
                        if (o === "vd") {
                            if (r >= h) {
                                a(g.grid.bDiv)[0].scrollTop = a(g.grid.bDiv)[0].scrollTop + g.rows[p].clientHeight
                            }
                        }
                        if (o === "vu") {
                            if (l < q) {
                                a(g.grid.bDiv)[0].scrollTop = a(g.grid.bDiv)[0].scrollTop - g.rows[p].clientHeight
                            }
                        }
                    }
                    if (o === "h") {
                        var k = a(g.grid.bDiv)[0].clientWidth,
                        j = a(g.grid.bDiv)[0].scrollLeft,
                        i = g.rows[p].cells[n].offsetLeft + g.rows[p].cells[n].clientWidth,
                        m = g.rows[p].cells[n].offsetLeft;
                        if (i >= k + parseInt(j, 10)) {
                            a(g.grid.bDiv)[0].scrollLeft = a(g.grid.bDiv)[0].scrollLeft + g.rows[p].cells[n].clientWidth
                        } else {
                            if (m < j) {
                                a(g.grid.bDiv)[0].scrollLeft = a(g.grid.bDiv)[0].scrollLeft - g.rows[p].cells[n].clientWidth
                            }
                        }
                    }
                }
                function b(l, h) {
                    var k, j;
                    if (h === "lft") {
                        k = l + 1;
                        for (j = l; j >= 0; j--) {
                            if (g.p.colModel[j].hidden !== true) {
                                k = j;
                                break
                            }
                        }
                    }
                    if (h === "rgt") {
                        k = l - 1;
                        for (j = l; j < g.p.colModel.length; j++) {
                            if (g.p.colModel[j].hidden !== true) {
                                k = j;
                                break
                            }
                        }
                    }
                    return k
                }
                a(f).insertBefore(g.grid.cDiv);
                a("#" + g.p.knv).focus().keydown(function(h) {
                    c = h.keyCode;
                    if (g.p.direction === "rtl") {
                        if (c === 37) {
                            c = 39
                        } else {
                            if (c === 39) {
                                c = 37
                            }
                        }
                    }
                    switch (c) {
                    case 38:
                        if (g.p.iRow - 1 > 0) {
                            e(g.p.iRow - 1, g.p.iCol, "vu");
                            a(g).jqGrid("editCell", g.p.iRow - 1, g.p.iCol, false)
                        }
                        break;
                    case 40:
                        if (g.p.iRow + 1 <= g.rows.length - 1) {
                            e(g.p.iRow + 1, g.p.iCol, "vd");
                            a(g).jqGrid("editCell", g.p.iRow + 1, g.p.iCol, false)
                        }
                        break;
                    case 37:
                        if (g.p.iCol - 1 >= 0) {
                            d = b(g.p.iCol - 1, "lft");
                            e(g.p.iRow, d, "h");
                            a(g).jqGrid("editCell", g.p.iRow, d, false)
                        }
                        break;
                    case 39:
                        if (g.p.iCol + 1 <= g.p.colModel.length - 1) {
                            d = b(g.p.iCol + 1, "rgt");
                            e(g.p.iRow, d, "h");
                            a(g).jqGrid("editCell", g.p.iRow, d, false)
                        }
                        break;
                    case 13:
                        if (parseInt(g.p.iCol, 10) >= 0 && parseInt(g.p.iRow, 10) >= 0) {
                            a(g).jqGrid("editCell", g.p.iRow, g.p.iCol, true)
                        }
                        break;
                    default:
                        return true
                    }
                    return false
                })
            })
        },
        getChangedCells: function(c) {
            var b = [];
            if (!c) {
                c = "all"
            }
            this.each(function() {
                var e = this,
                d;
                if (!e.grid || e.p.cellEdit !== true) {
                    return
                }
                a(e.rows).each(function(f) {
                    var g = {};
                    if (a(this).hasClass("edited")) {
                        a("td", this).each(function(h) {
                            d = e.p.colModel[h].name;
                            if (d !== "cb" && d !== "subgrid") {
                                if (c === "dirty") {
                                    if (a(this).hasClass("dirty-cell")) {
                                        try {
                                            g[d] = a.unformat.call(e, this, {
                                                rowId: e.rows[f].id,
                                                colModel: e.p.colModel[h]
                                            },
                                            h)
                                        } catch(j) {
                                            g[d] = a.jgrid.htmlDecode(a(this).html())
                                        }
                                    }
                                } else {
                                    try {
                                        g[d] = a.unformat.call(e, this, {
                                            rowId: e.rows[f].id,
                                            colModel: e.p.colModel[h]
                                        },
                                        h)
                                    } catch(j) {
                                        g[d] = a.jgrid.htmlDecode(a(this).html())
                                    }
                                }
                            }
                        });
                        g.id = this.id;
                        b.push(g)
                    }
                })
            });
            return b
        }
    })
})(jQuery); (function(a) {
    a.extend(a.jgrid, {
        showModal: function(b) {
            b.w.show()
        },
        closeModal: function(b) {
            b.w.hide().attr("aria-hidden", "true");
            if (b.o) {
                b.o.remove()
            }
        },
        hideModal: function(c, j) {
            j = a.extend({
                jqm: true,
                gb: "",
                removemodal: false,
                formprop: false,
                form: ""
            },
            j || {});
            var h = j.gb && typeof j.gb === "string" && j.gb.substr(0, 6) === "#gbox_" ? a("#" + j.gb.substr(6))[0] : false;
            if (j.onClose) {
                var g = h ? j.onClose.call(h, c) : j.onClose(c);
                if (typeof g === "boolean" && !g) {
                    return
                }
            }
            if (j.formprop && h && j.form) {
                var b = a(c)[0].style.height;
                if (b.indexOf("px") > -1) {
                    b = parseFloat(b)
                }
                var f, d;
                if (j.form === "edit") {
                    f = "#" + a.jgrid.jqID("FrmGrid_" + j.gb.substr(6));
                    d = "formProp"
                } else {
                    if (j.form === "view") {
                        f = "#" + a.jgrid.jqID("ViewGrid_" + j.gb.substr(6));
                        d = "viewProp"
                    }
                }
                a(h).data(d, {
                    top: parseFloat(a(c).css("top")),
                    left: parseFloat(a(c).css("left")),
                    width: a(c).width(),
                    height: b,
                    dataheight: a(f).height(),
                    datawidth: a(f).width()
                })
            }
            if (a.fn.jqm && j.jqm === true) {
                a(c).attr("aria-hidden", "true").jqmHide()
            } else {
                if (j.gb !== "") {
                    try {
                        a(".jqgrid-overlay:first", j.gb).hide()
                    } catch(i) {}
                }
                a(c).hide().attr("aria-hidden", "true")
            }
            if (j.removemodal) {
                a(c).remove()
            }
        },
        findPos: function(c) {
            var d = 0,
            b = 0;
            if (c.offsetParent) {
                do {
                    d += c.offsetLeft;
                    b += c.offsetTop
                } while ( c = c . offsetParent )
            }
            return [d, b]
        },
        createModal: function(i, q, m, b, v, c, h) {
            m = a.extend(true, {},
            a.jgrid.jqModal || {},
            m);
            var k = document.createElement("div"),
            s,
            l = this;
            h = a.extend({},
            h || {});
            s = a(m.gbox).attr("dir") === "rtl" ? true: false;
            k.className = "ui-widget ui-widget-content ui-corner-all ui-jqdialog";
            k.id = i.themodal;
            var u = document.createElement("div");
            u.className = "ui-jqdialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix";
            u.id = i.modalhead;
            a(u).append("<span class='ui-jqdialog-title'>" + m.caption + "</span>");
            var n = a("<a class='ui-jqdialog-titlebar-close ui-corner-all'></a>").hover(function() {
                n.addClass("ui-state-hover")
            },
            function() {
                n.removeClass("ui-state-hover")
            }).append("<span class='ui-icon ui-icon-closethick'></span>");
            a(u).append(n);
            if (s) {
                k.dir = "rtl";
                a(".ui-jqdialog-title", u).css("float", "right");
                a(".ui-jqdialog-titlebar-close", u).css("left", 0.3 + "em")
            } else {
                k.dir = "ltr";
                a(".ui-jqdialog-title", u).css("float", "left");
                a(".ui-jqdialog-titlebar-close", u).css("right", 0.3 + "em")
            }
            var w = document.createElement("div");
            a(w).addClass("ui-jqdialog-content ui-widget-content").attr("id", i.modalcontent);
            a(w).append(q);
            k.appendChild(w);
            a(k).prepend(u);
            if (c === true) {
                a("body").append(k)
            } else {
                if (typeof c === "string") {
                    a(c).append(k)
                } else {
                    a(k).insertBefore(b)
                }
            }
            a(k).css(h);
            if (m.jqModal === undefined) {
                m.jqModal = true
            }
            var o = {};
            if (a.fn.jqm && m.jqModal === true) {
                if (m.left === 0 && m.top === 0 && m.overlay) {
                    var d = [];
                    d = a.jgrid.findPos(v);
                    m.left = d[0] + 4;
                    m.top = d[1] + 4
                }
                o.top = m.top + "px";
                o.left = m.left + a(window).width() / 2 - m.width / 2
            } else {
                if (m.left !== 0 || m.top !== 0) {
                    o.left = m.left;
                    o.top = m.top + "px"
                }
            }
            a("a.ui-jqdialog-titlebar-close", u).click(function() {
                var e = a("#" + a.jgrid.jqID(i.themodal)).data("onClose") || m.onClose;
                var p = a("#" + a.jgrid.jqID(i.themodal)).data("gbox") || m.gbox;
                l.hideModal("#" + a.jgrid.jqID(i.themodal), {
                    gb: p,
                    jqm: m.jqModal,
                    onClose: e,
                    removemodal: m.removemodal || false,
                    formprop: !m.recreateForm || false,
                    form: m.form || ""
                });
                return false
            });
            if (m.width === 0 || !m.width) {
                m.width = 300
            }
            if (m.height === 0 || !m.height) {
                m.height = 200
            }
            if (!m.zIndex) {
                var f = a(b).parents("*[role=dialog]").filter(":first").css("z-index");
                if (f) {
                    m.zIndex = parseInt(f, 10) + 2
                } else {
                    m.zIndex = 950
                }
            }
            var g = 0;
            if (s && o.left && !c) {
                g = a(m.gbox).width() - (!isNaN(m.width) ? parseInt(m.width, 10) : 0) - 8;
                o.left = parseInt(o.left, 10) + parseInt(g, 10)
            }
            if (o.left) {
                o.left += "px"
            }
            a(k).css(a.extend({
                width: isNaN(m.width) ? "auto": m.width + "px",
                height: isNaN(m.height) ? "auto": m.height + "px",
                zIndex: m.zIndex,
                overflow: "hidden"
            },
            o)).attr({
                tabIndex: "-1",
                role: "dialog",
                "aria-labelledby": i.modalhead,
                "aria-hidden": "true"
            });
            if (m.drag === undefined) {
                m.drag = true
            }
            if (m.resize === undefined) {
                m.resize = true
            }
            if (m.drag) {
                a(u).css("cursor", "move");
                if (a.fn.jqDrag) {
                    a(k).jqDrag(u)
                } else {
                    try {
                        a(k).draggable({
                            handle: a("#" + a.jgrid.jqID(u.id))
                        })
                    } catch(t) {}
                }
            }
            if (m.resize) {
                if (a.fn.jqResize) {
                    a(k).append("<div class='jqResize ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se'></div>");
                    a("#" + a.jgrid.jqID(i.themodal)).jqResize(".jqResize", i.scrollelm ? "#" + a.jgrid.jqID(i.scrollelm) : false)
                } else {
                    try {
                        a(k).resizable({
                            handles: "se, sw",
                            alsoResize: i.scrollelm ? "#" + a.jgrid.jqID(i.scrollelm) : false
                        })
                    } catch(j) {}
                }
            }
            if (m.closeOnEscape === true) {
                a(k).keydown(function(r) {
                    if (r.which === 27) {
                        var p = a("#" + a.jgrid.jqID(i.themodal)).data("onClose") || m.onClose;
                        l.hideModal("#" + a.jgrid.jqID(i.themodal), {
                            gb: m.gbox,
                            jqm: m.jqModal,
                            onClose: p,
                            removemodal: m.removemodal || false,
                            formprop: !m.recreateForm || false,
                            form: m.form || ""
                        })
                    }
                })
            }
        },
        viewModal: function(b, d) {
            d = a.extend({
                toTop: true,
                overlay: 10,
                modal: false,
                overlayClass: "ui-widget-overlay",
                onShow: a.jgrid.showModal,
                onHide: a.jgrid.closeModal,
                gbox: "",
                jqm: true,
                jqM: true
            },
            d || {});
            if (a.fn.jqm && d.jqm === true) {
                if (d.jqM) {
                    a(b).attr("aria-hidden", "false").jqm(d).jqmShow()
                } else {
                    a(b).attr("aria-hidden", "false").jqmShow()
                }
            } else {
                if (d.gbox !== "") {
                    a(".jqgrid-overlay:first", d.gbox).show();
                    a(b).data("gbox", d.gbox)
                }
                a(b).show().attr("aria-hidden", "false");
                try {
                    a(":input:visible", b)[0].focus()
                } catch(c) {}
            }
        },
        info_dialog: function(q, k, c, p) {
            var n = {
                width: 290,
                height: "auto",
                dataheight: "auto",
                drag: true,
                resize: false,
                left: 250,
                top: 170,
                zIndex: 1000,
                jqModal: true,
                modal: false,
                closeOnEscape: true,
                align: "center",
                buttonalign: "center",
                buttons: []
            };
            a.extend(true, n, a.jgrid.jqModal || {},
            {
                caption: "<b>" + q + "</b>"
            },
            p || {});
            var f = n.jqModal,
            r = this;
            if (a.fn.jqm && !f) {
                f = false
            }
            var h = "",
            g;
            if (n.buttons.length > 0) {
                for (g = 0; g < n.buttons.length; g++) {
                    if (n.buttons[g].id === undefined) {
                        n.buttons[g].id = "info_button_" + g
                    }
                    h += "<a id='" + n.buttons[g].id + "' class='fm-button ui-state-default ui-corner-all'>" + n.buttons[g].text + "</a>"
                }
            }
            var l = isNaN(n.dataheight) ? n.dataheight: n.dataheight + "px",
            o = "text-align:" + n.align + ";";
            var b = "<div id='info_id'>";
            b += "<div id='infocnt' style='margin:0px;padding-bottom:1em;width:100%;overflow:auto;position:relative;height:" + l + ";" + o + "'>" + k + "</div>";
            b += c ? "<div class='ui-widget-content ui-helper-clearfix' style='text-align:" + n.buttonalign + ";padding-bottom:0.8em;padding-top:0.5em;background-image: none;border-width: 1px 0 0 0;'><a id='closedialog' class='fm-button ui-state-default ui-corner-all'>" + c + "</a>" + h + "</div>": h !== "" ? "<div class='ui-widget-content ui-helper-clearfix' style='text-align:" + n.buttonalign + ";padding-bottom:0.8em;padding-top:0.5em;background-image: none;border-width: 1px 0 0 0;'>" + h + "</div>": "";
            b += "</div>";
            try {
                if (a("#info_dialog").attr("aria-hidden") === "false") {
                    a.jgrid.hideModal("#info_dialog", {
                        jqm: f
                    })
                }
                a("#info_dialog").remove()
            } catch(j) {}
            a.jgrid.createModal({
                themodal: "info_dialog",
                modalhead: "info_head",
                modalcontent: "info_content",
                scrollelm: "infocnt"
            },
            b, n, "", "", true);
            if (h) {
                a.each(n.buttons,
                function(e) {
                    a("#" + a.jgrid.jqID(this.id), "#info_id").bind("click",
                    function() {
                        n.buttons[e].onClick.call(a("#info_dialog"));
                        return false
                    })
                })
            }
            a("#closedialog", "#info_id").click(function() {
                r.hideModal("#info_dialog", {
                    jqm: f,
                    onClose: a("#info_dialog").data("onClose") || n.onClose,
                    gb: a("#info_dialog").data("gbox") || n.gbox
                });
                return false
            });
            a(".fm-button", "#info_dialog").hover(function() {
                a(this).addClass("ui-state-hover")
            },
            function() {
                a(this).removeClass("ui-state-hover")
            });
            if (a.isFunction(n.beforeOpen)) {
                n.beforeOpen()
            }
            a.jgrid.viewModal("#info_dialog", {
                onHide: function(e) {
                    e.w.hide().remove();
                    if (e.o) {
                        e.o.remove()
                    }
                },
                modal: n.modal,
                jqm: f
            });
            if (a.isFunction(n.afterOpen)) {
                n.afterOpen()
            }
            try {
                a("#info_dialog").focus()
            } catch(d) {}
        },
        bindEv: function(c, b) {
            var d = this;
            if (a.isFunction(b.dataInit)) {
                b.dataInit.call(d, c, b)
            }
            if (b.dataEvents) {
                a.each(b.dataEvents,
                function() {
                    if (this.data !== undefined) {
                        a(c).bind(this.type, this.data, this.fn)
                    } else {
                        a(c).bind(this.type, this.fn)
                    }
                })
            }
        },
        createEl: function(f, h, z, n, x) {
            var y = "",
            t = this;
            function v(F, E, i) {
                var e = ["dataInit", "dataEvents", "dataUrl", "buildSelect", "sopt", "searchhidden", "defaultValue", "attr", "custom_element", "custom_value"];
                if (i !== undefined && a.isArray(i)) {
                    a.merge(e, i)
                }
                a.each(E,
                function(G, H) {
                    if (a.inArray(G, e) === -1) {
                        if (G == "id") {
                            H = a.jgrid.jqID(H)
                        }
                        a(F).attr(G, H)
                    }
                });
                if (!E.hasOwnProperty("id")) {
                    a(F).attr("id", a.jgrid.randId())
                }
            }
            switch (f) {
            case "textarea":
                y = document.createElement("textarea");
                if (n) {
                    if (!h.cols) {
                        a(y).css({
                            width: "99.9%"
                        })
                    }
                } else {
                    if (!h.cols) {
                        h.cols = 20
                    }
                }
                if (!h.rows) {
                    h.rows = 2
                }
                if (z === "&nbsp;" || z === "&#160;" || (z.length === 1 && z.charCodeAt(0) === 160)) {
                    z = ""
                }
                y.value = z;
                v(y, h);
                a(y).attr({
                    role: "textbox",
                    multiline: "true"
                });
                break;
            case "checkbox":
                y = document.createElement("input");
                y.type = "checkbox";
                if (!h.value) {
                    var D = (z + "").toLowerCase();
                    if (D.search(/(false|f|0|no|n|off|undefined)/i) < 0 && D !== "") {
                        y.checked = true;
                        y.defaultChecked = true;
                        y.value = z
                    } else {
                        y.value = "on"
                    }
                    a(y).attr("offval", "off")
                } else {
                    var r = h.value.split(":");
                    if (z === r[0]) {
                        y.checked = true;
                        y.defaultChecked = true
                    }
                    y.value = r[0];
                    a(y).attr("offval", r[1])
                }
                v(y, h, ["value"]);
                a(y).attr("role", "checkbox");
                break;
            case "select":
                y = document.createElement("select");
                y.setAttribute("role", "select");
                a(y).css({
                    width: "99.9%"
                });
                var d, j = [];
                if (h.multiple === true) {
                    d = true;
                    y.multiple = "multiple";
                    a(y).attr("aria-multiselectable", "true")
                } else {
                    d = false
                }
                if (h.dataUrl !== undefined) {
                    var l = null,
                    g = h.postData || x.postData;
                    try {
                        l = h.rowId
                    } catch(w) {}
                    if (t.p && t.p.idPrefix) {
                        l = a.jgrid.stripPref(t.p.idPrefix, l)
                    }
                    a.ajax(a.extend({
                        url: a.isFunction(h.dataUrl) ? h.dataUrl.call(t, l, z, String(h.name)) : h.dataUrl,
                        type: "GET",
                        dataType: "html",
                        data: a.isFunction(g) ? g.call(t, l, z, String(h.name)) : g,
                        context: {
                            elem: y,
                            options: h,
                            vl: z
                        },
                        success: function(I) {
                            var i = [],
                            H = this.elem,
                            G = this.vl,
                            E = a.extend({},
                            this.options),
                            F = E.multiple === true,
                            e = a.isFunction(E.buildSelect) ? E.buildSelect.call(t, I) : I;
                            if (typeof e === "string") {
                                e = a(a.trim(e)).html()
                            }
                            if (e) {
                                a(H).append(e);
                                v(H, E, g ? ["postData"] : undefined);
                                if (E.size === undefined) {
                                    E.size = F ? 3 : 1
                                }
                                if (F) {
                                    i = G.split(",");
                                    i = a.map(i,
                                    function(J) {
                                        return a.trim(J)
                                    })
                                } else {
                                    i[0] = a.trim(G)
                                }
                                setTimeout(function() {
                                    a("option", H).each(function(J) {
                                        if (J === 0 && H.multiple) {
                                            this.selected = false
                                        }
                                        a(this).attr("role", "option");
                                        if (a.inArray(a.trim(a(this).text()), i) > -1 || a.inArray(a.trim(a(this).val()), i) > -1) {
                                            this.selected = "selected"
                                        }
                                    })
                                },
                                0)
                            }
                        }
                    },
                    x || {}))
                } else {
                    if (h.value) {
                        var s;
                        if (h.size === undefined) {
                            h.size = d ? 3 : 1
                        }
                        if (d) {
                            j = z.split(",");
                            j = a.map(j,
                            function(e) {
                                return a.trim(e)
                            })
                        }
                        if (typeof h.value === "function") {
                            h.value = h.value()
                        }
                        var u, p, k, o = h.separator === undefined ? ":": h.separator,
                        A = h.delimiter === undefined ? ";": h.delimiter;
                        if (typeof h.value === "string") {
                            u = h.value.split(A);
                            for (s = 0; s < u.length; s++) {
                                p = u[s].split(o);
                                if (p.length > 2) {
                                    p[1] = a.map(p,
                                    function(i, e) {
                                        if (e > 0) {
                                            return i
                                        }
                                    }).join(o)
                                }
                                k = document.createElement("option");
                                k.setAttribute("role", "option");
                                k.value = p[0];
                                k.innerHTML = p[1];
                                y.appendChild(k);
                                if (!d && (a.trim(p[0]) === a.trim(z) || a.trim(p[1]) === a.trim(z))) {
                                    k.selected = "selected"
                                }
                                if (d && (a.inArray(a.trim(p[1]), j) > -1 || a.inArray(a.trim(p[0]), j) > -1)) {
                                    k.selected = "selected"
                                }
                            }
                        } else {
                            if (typeof h.value === "object") {
                                var c = h.value,
                                C;
                                for (C in c) {
                                    if (c.hasOwnProperty(C)) {
                                        k = document.createElement("option");
                                        k.setAttribute("role", "option");
                                        k.value = C;
                                        k.innerHTML = c[C];
                                        y.appendChild(k);
                                        if (!d && (a.trim(C) === a.trim(z) || a.trim(c[C]) === a.trim(z))) {
                                            k.selected = "selected"
                                        }
                                        if (d && (a.inArray(a.trim(c[C]), j) > -1 || a.inArray(a.trim(C), j) > -1)) {
                                            k.selected = "selected"
                                        }
                                    }
                                }
                            }
                        }
                        v(y, h, ["value"])
                    } else {
                        if (h.items) {
                            if (h.size === undefined) {
                                h.size = d ? 3 : 1
                            }
                            if (d) {
                                j = z.split(",");
                                j = a.map(j,
                                function(e) {
                                    return a.trim(e)
                                })
                            }
                            if (a.isArray(h.items)) {
                                var m, q;
                                for (var s = 0; s < h.items.length; s++) {
                                    m = h.items[s][h.itemLabel];
                                    q = h.items[s][h.itemValue];
                                    k = document.createElement("option");
                                    k.setAttribute("role", "option");
                                    k.value = q;
                                    k.innerHTML = m;
                                    y.appendChild(k);
                                    if (!d && (a.trim(q) === a.trim(z) || a.trim(m) === a.trim(z))) {
                                        k.selected = "selected"
                                    }
                                    if (d && (a.inArray(a.trim(m), j) > -1 || a.inArray(a.trim(q), j) > -1)) {
                                        k.selected = "selected"
                                    }
                                }
                            }
                            v(y, h, ["items", "itemLabel", "itemValue"])
                        }
                    }
                }
                break;
            case "text":
            case "password":
            case "button":
                var B;
                if (f === "button") {
                    B = "button"
                } else {
                    B = "textbox"
                }
                y = document.createElement("input");
                y.type = f;
                y.value = z;
                v(y, h);
                if (f !== "button") {
                    if (n) {
                        if (!h.size) {
                            a(y).css({
                                width: "99.9%"
                            })
                        }
                    } else {
                        if (!h.size) {
                            h.size = 20
                        }
                    }
                }
                a(y).attr("role", B);
                break;
            case "image":
            case "file":
                y = document.createElement("input");
                y.type = f;
                v(y, h);
                break;
            case "custom":
                y = document.createElement("span");
                try {
                    if (a.isFunction(h.custom_element)) {
                        var b = h.custom_element.call(t, z, h);
                        if (b) {
                            b = a(b).addClass("customelement").attr({
                                id: h.id,
                                name: h.name
                            });
                            a(y).empty().append(b)
                        } else {
                            throw "e2"
                        }
                    } else {
                        throw "e1"
                    }
                } catch(w) {
                    if (w === "e1") {
                        a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_element' " + a.jgrid.edit.msg.nodefined, a.jgrid.edit.bClose)
                    }
                    if (w === "e2") {
                        a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_element' " + a.jgrid.edit.msg.novalue, a.jgrid.edit.bClose)
                    } else {
                        a.jgrid.info_dialog(a.jgrid.errors.errcap, typeof w === "string" ? w: w.message, a.jgrid.edit.bClose)
                    }
                }
                break
            }
            return y
        },
        checkDate: function(n, d) {
            var l = function(i) {
                return (((i % 4 === 0) && (i % 100 !== 0 || (i % 400 === 0))) ? 29 : 28)
            },
            f = {},
            p;
            n = n.toLowerCase();
            if (n.indexOf("/") !== -1) {
                p = "/"
            } else {
                if (n.indexOf("-") !== -1) {
                    p = "-"
                } else {
                    if (n.indexOf(".") !== -1) {
                        p = "."
                    } else {
                        p = "/"
                    }
                }
            }
            n = n.split(p);
            d = d.split(p);
            if (d.length !== 3) {
                return false
            }
            var g = -1,
            o, h = -1,
            e = -1,
            k;
            for (k = 0; k < n.length; k++) {
                var c = isNaN(d[k]) ? 0 : parseInt(d[k], 10);
                f[n[k]] = c;
                o = n[k];
                if (o.indexOf("y") !== -1) {
                    g = k
                }
                if (o.indexOf("m") !== -1) {
                    e = k
                }
                if (o.indexOf("d") !== -1) {
                    h = k
                }
            }
            if (n[g] === "y" || n[g] === "yyyy") {
                o = 4
            } else {
                if (n[g] === "yy") {
                    o = 2
                } else {
                    o = -1
                }
            }
            var b = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
            m;
            if (g === -1) {
                return false
            }
            m = f[n[g]].toString();
            if (o === 2 && m.length === 1) {
                o = 1
            }
            if (m.length !== o || (f[n[g]] === 0 && d[g] !== "00")) {
                return false
            }
            if (e === -1) {
                return false
            }
            m = f[n[e]].toString();
            if (m.length < 1 || f[n[e]] < 1 || f[n[e]] > 12) {
                return false
            }
            if (h === -1) {
                return false
            }
            m = f[n[h]].toString();
            if (m.length < 1 || f[n[h]] < 1 || f[n[h]] > 31 || (f[n[e]] === 2 && f[n[h]] > l(f[n[g]])) || f[n[h]] > b[f[n[e]]]) {
                return false
            }
            return true
        },
        isEmpty: function(b) {
            if (b.match(/^\s+$/) || b === "") {
                return true
            }
            return false
        },
        checkTime: function(d) {
            var c = /^(\d{1,2}):(\d{2})([apAP][Mm])?$/,
            b;
            if (!a.jgrid.isEmpty(d)) {
                b = d.match(c);
                if (b) {
                    if (b[3]) {
                        if (b[1] < 1 || b[1] > 12) {
                            return false
                        }
                    } else {
                        if (b[1] > 23) {
                            return false
                        }
                    }
                    if (b[2] > 59) {
                        return false
                    }
                } else {
                    return false
                }
            }
            return true
        },
        checkValues: function(c, n, p, h) {
            var f, j, q, d, l, k = this,
            o = k.p.colModel;
            if (p === undefined) {
                if (typeof n === "string") {
                    for (j = 0, l = o.length; j < l; j++) {
                        if (o[j].name === n) {
                            f = o[j].editrules;
                            n = j;
                            if (o[j].formoptions != null) {
                                q = o[j].formoptions.label
                            }
                            break
                        }
                    }
                } else {
                    if (n >= 0) {
                        f = o[n].editrules
                    }
                }
            } else {
                f = p;
                q = h === undefined ? "_": h
            }
            if (f) {
                if (!q) {
                    q = k.p.colNames != null ? k.p.colNames[n] : o[n].label
                }
                if (f.required === true) {
                    if (a.jgrid.isEmpty(c)) {
                        return [false, q + ": " + a.jgrid.edit.msg.required, ""]
                    }
                }
                var e = f.required === false ? false: true;
                if (f.number === true) {
                    if (! (e === false && a.jgrid.isEmpty(c))) {
                        if (isNaN(c)) {
                            return [false, q + ": " + a.jgrid.edit.msg.number, ""]
                        }
                    }
                }
                if (f.minValue !== undefined && !isNaN(f.minValue)) {
                    if (parseFloat(c) < parseFloat(f.minValue)) {
                        return [false, q + ": " + a.jgrid.edit.msg.minValue + " " + f.minValue, ""]
                    }
                }
                if (f.maxValue !== undefined && !isNaN(f.maxValue)) {
                    if (parseFloat(c) > parseFloat(f.maxValue)) {
                        return [false, q + ": " + a.jgrid.edit.msg.maxValue + " " + f.maxValue, ""]
                    }
                }
                var b;
                if (f.email === true) {
                    if (! (e === false && a.jgrid.isEmpty(c))) {
                        b = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;
                        if (!b.test(c)) {
                            return [false, q + ": " + a.jgrid.edit.msg.email, ""]
                        }
                    }
                }
                if (f.integer === true) {
                    if (! (e === false && a.jgrid.isEmpty(c))) {
                        if (isNaN(c)) {
                            return [false, q + ": " + a.jgrid.edit.msg.integer, ""]
                        }
                        if ((c % 1 !== 0) || (c.indexOf(".") !== -1)) {
                            return [false, q + ": " + a.jgrid.edit.msg.integer, ""]
                        }
                    }
                }
                if (f.date === true) {
                    if (! (e === false && a.jgrid.isEmpty(c))) {
                        if (o[n].formatoptions && o[n].formatoptions.newformat) {
                            d = o[n].formatoptions.newformat;
                            if (a.jgrid.formatter.date.masks.hasOwnProperty(d)) {
                                d = a.jgrid.formatter.date.masks[d]
                            }
                        } else {
                            d = o[n].datefmt || "Y-m-d"
                        }
                        if (!a.jgrid.checkDate(d, c)) {
                            return [false, q + ": " + a.jgrid.edit.msg.date + " - " + d, ""]
                        }
                    }
                }
                if (f.time === true) {
                    if (! (e === false && a.jgrid.isEmpty(c))) {
                        if (!a.jgrid.checkTime(c)) {
                            return [false, q + ": " + a.jgrid.edit.msg.date + " - hh:mm (am/pm)", ""]
                        }
                    }
                }
                if (f.url === true) {
                    if (! (e === false && a.jgrid.isEmpty(c))) {
                        b = /^(((https?)|(ftp)):\/\/([\-\w]+\.)+\w{2,3}(\/[%\-\w]+(\.\w{2,})?)*(([\w\-\.\?\\\/+@&#;`~=%!]*)(\.\w{2,})?)*\/?)/i;
                        if (!b.test(c)) {
                            return [false, q + ": " + a.jgrid.edit.msg.url, ""]
                        }
                    }
                }
                if (f.custom === true) {
                    if (! (e === false && a.jgrid.isEmpty(c))) {
                        if (a.isFunction(f.custom_func)) {
                            var m = f.custom_func.call(k, c, q, n);
                            return a.isArray(m) ? m: [false, a.jgrid.edit.msg.customarray, ""]
                        }
                        return [false, a.jgrid.edit.msg.customfcheck, ""]
                    }
                }
            }
            return [true, "", ""]
        }
    })
})(jQuery); (function(a) {
    a.jgrid.extend({
        getColProp: function(d) {
            var b = {},
            f = this[0];
            if (!f.grid) {
                return false
            }
            var e = f.p.colModel,
            c;
            for (c = 0; c < e.length; c++) {
                if (e[c].name === d) {
                    b = e[c];
                    break
                }
            }
            return b
        },
        setColProp: function(c, b) {
            return this.each(function() {
                if (this.grid) {
                    if (b) {
                        var e = this.p.colModel,
                        d;
                        for (d = 0; d < e.length; d++) {
                            if (e[d].name === c) {
                                a.extend(true, this.p.colModel[d], b);
                                break
                            }
                        }
                    }
                }
            })
        },
        sortGrid: function(c, b, d) {
            return this.each(function() {
                var j = this,
                e = -1,
                h, g = false;
                if (!j.grid) {
                    return
                }
                if (!c) {
                    c = j.p.sortname
                }
                for (h = 0; h < j.p.colModel.length; h++) {
                    if (j.p.colModel[h].index === c || j.p.colModel[h].name === c) {
                        e = h;
                        if (j.p.frozenColumns === true && j.p.colModel[h].frozen === true) {
                            g = j.grid.fhDiv.find("#" + j.p.id + "_" + c)
                        }
                        break
                    }
                }
                if (e !== -1) {
                    var f = j.p.colModel[e].sortable;
                    if (!g) {
                        g = j.grid.headers[e].el
                    }
                    if (typeof f !== "boolean") {
                        f = true
                    }
                    if (typeof b !== "boolean") {
                        b = false
                    }
                    if (f) {
                        j.sortData("jqgh_" + j.p.id + "_" + c, e, b, d, g)
                    }
                }
            })
        },
        clearBeforeUnload: function() {
            return this.each(function() {
                var d = this.grid;
                if (a.isFunction(d.emptyRows)) {
                    d.emptyRows.call(this, true, true)
                }
                a(document).unbind("mouseup.jqGrid" + this.p.id);
                a(d.hDiv).unbind("mousemove");
                a(this).unbind();
                d.dragEnd = null;
                d.dragMove = null;
                d.dragStart = null;
                d.emptyRows = null;
                d.populate = null;
                d.populateVisible = null;
                d.scrollGrid = null;
                d.selectionPreserver = null;
                d.bDiv = null;
                d.cDiv = null;
                d.hDiv = null;
                d.cols = null;
                var c, b = d.headers.length;
                for (c = 0; c < b; c++) {
                    d.headers[c].el = null
                }
                this.formatCol = null;
                this.sortData = null;
                this.updatepager = null;
                this.refreshIndex = null;
                this.setHeadCheckBox = null;
                this.constructTr = null;
                this.formatter = null;
                this.addXmlData = null;
                this.addJSONData = null;
                this.grid = null
            })
        },
        GridDestroy: function() {
            return this.each(function() {
                if (this.grid) {
                    if (this.p.pager) {
                        a(this.p.pager).remove()
                    }
                    try {
                        a(this).jqGrid("clearBeforeUnload");
                        a("#gbox_" + a.jgrid.jqID(this.id)).remove();
                        a("#alertmod_" + a.jgrid.jqID(this.id)).remove()
                    } catch(b) {}
                }
            })
        },
        GridUnload: function() {
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var d = {
                    id: a(this).attr("id"),
                    cl: a(this).attr("class")
                };
                if (this.p.pager) {
                    a(this.p.pager).empty().removeClass("ui-state-default ui-jqgrid-pager ui-corner-bottom")
                }
                var b = document.createElement("table");
                a(b).attr({
                    id: d.id
                });
                b.className = d.cl;
                var c = a.jgrid.jqID(this.id);
                a(b).removeClass("ui-jqgrid-btable");
                if (a(this.p.pager).parents("#gbox_" + c).length === 1) {
                    a(b).insertBefore("#gbox_" + c).show();
                    a(this.p.pager).insertBefore("#gbox_" + c)
                } else {
                    a(b).insertBefore("#gbox_" + c).show()
                }
                a(this).jqGrid("clearBeforeUnload");
                a("#gbox_" + c).remove()
            })
        },
        setGridState: function(b) {
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var c = this;
                if (b === "hidden") {
                    a(".ui-jqgrid-bdiv, .ui-jqgrid-hdiv", "#gview_" + a.jgrid.jqID(c.p.id)).slideUp("fast");
                    if (c.p.pager) {
                        a(c.p.pager).slideUp("fast")
                    }
                    if (c.p.toppager) {
                        a(c.p.toppager).slideUp("fast")
                    }
                    if (c.p.toolbar[0] === true) {
                        if (c.p.toolbar[1] === "both") {
                            a(c.grid.ubDiv).slideUp("fast")
                        }
                        a(c.grid.uDiv).slideUp("fast")
                    }
                    if (c.p.footerrow) {
                        a(".ui-jqgrid-sdiv", "#gbox_" + a.jgrid.jqID(c.p.id)).slideUp("fast")
                    }
                    a(".ui-jqgrid-titlebar-close span", c.grid.cDiv).removeClass("ui-icon-circle-triangle-n").addClass("ui-icon-circle-triangle-s");
                    c.p.gridstate = "hidden"
                } else {
                    if (b === "visible") {
                        a(".ui-jqgrid-hdiv, .ui-jqgrid-bdiv", "#gview_" + a.jgrid.jqID(c.p.id)).slideDown("fast");
                        if (c.p.pager) {
                            a(c.p.pager).slideDown("fast")
                        }
                        if (c.p.toppager) {
                            a(c.p.toppager).slideDown("fast")
                        }
                        if (c.p.toolbar[0] === true) {
                            if (c.p.toolbar[1] === "both") {
                                a(c.grid.ubDiv).slideDown("fast")
                            }
                            a(c.grid.uDiv).slideDown("fast")
                        }
                        if (c.p.footerrow) {
                            a(".ui-jqgrid-sdiv", "#gbox_" + a.jgrid.jqID(c.p.id)).slideDown("fast")
                        }
                        a(".ui-jqgrid-titlebar-close span", c.grid.cDiv).removeClass("ui-icon-circle-triangle-s").addClass("ui-icon-circle-triangle-n");
                        c.p.gridstate = "visible"
                    }
                }
            })
        },
        filterToolbar: function(b) {
            b = a.extend({
                autosearch: true,
                autosearchDelay: 500,
                searchOnEnter: true,
                beforeSearch: null,
                afterSearch: null,
                beforeClear: null,
                afterClear: null,
                searchurl: "",
                stringResult: false,
                groupOp: "AND",
                defaultSearch: "bw",
                searchOperators: false,
                resetIcon: "x",
                operands: {
                    eq: "==",
                    ne: "!",
                    lt: "<",
                    le: "<=",
                    gt: ">",
                    ge: ">=",
                    bw: "^",
                    bn: "!^",
                    "in": "=",
                    ni: "!=",
                    ew: "|",
                    en: "!@",
                    cn: "~",
                    nc: "!~",
                    nu: "#",
                    nn: "!#"
                }
            },
            a.jgrid.search, b || {});
            return this.each(function() {
                var i = this;
                if (this.ftoolbar) {
                    return
                }
                var c = function() {
                    var o = {},
                    n = 0,
                    t, u, k = {},
                    l;
                    a.each(i.p.colModel,
                    function() {
                        var j = a("#gs_" + i.p.idPrefix + a.jgrid.jqID(this.name), (this.frozen === true && i.p.frozenColumns === true) ? i.grid.fhDiv: i.grid.hDiv);
                        u = this.index || this.name;
                        if (b.searchOperators) {
                            l = j.parent().prev().children("a").attr("soper") || b.defaultSearch
                        } else {
                            l = (this.searchoptions && this.searchoptions.sopt) ? this.searchoptions.sopt[0] : this.stype === "select" ? "eq": b.defaultSearch
                        }
                        t = this.stype === "custom" && a.isFunction(this.searchoptions.custom_value) && j.length > 0 && j[0].nodeName.toUpperCase() === "SPAN" ? this.searchoptions.custom_value.call(i, j.children(".customelement:first"), "get") : j.val();
                        if (t || l === "nu" || l === "nn") {
                            o[u] = t;
                            k[u] = l;
                            n++
                        } else {
                            try {
                                delete i.p.postData[u]
                            } catch(v) {}
                        }
                    });
                    var r = n > 0 ? true: false;
                    if (b.stringResult === true || i.p.datatype === "local" || b.searchOperators === true) {
                        var s = '{"groupOp":"' + b.groupOp + '","rules":[';
                        var q = 0;
                        a.each(o,
                        function(j, v) {
                            if (q > 0) {
                                s += ","
                            }
                            s += '{"field":"' + j + '",';
                            s += '"op":"' + k[j] + '",';
                            v += "";
                            s += '"data":"' + v.replace(/\\/g, "\\\\").replace(/\"/g, '\\"') + '"}';
                            q++
                        });
                        s += "]}";
                        a.extend(i.p.postData, {
                            filters: s
                        });
                        a.each(["searchField", "searchString", "searchOper"],
                        function(j, v) {
                            if (i.p.postData.hasOwnProperty(v)) {
                                delete i.p.postData[v]
                            }
                        })
                    } else {
                        a.extend(i.p.postData, o)
                    }
                    var p;
                    if (i.p.searchurl) {
                        p = i.p.url;
                        a(i).jqGrid("setGridParam", {
                            url: i.p.searchurl
                        })
                    }
                    var m = a(i).triggerHandler("jqGridToolbarBeforeSearch") === "stop" ? true: false;
                    if (!m && a.isFunction(b.beforeSearch)) {
                        m = b.beforeSearch.call(i)
                    }
                    if (!m) {
                        a(i).jqGrid("setGridParam", {
                            search: r
                        }).trigger("reloadGrid", [{
                            page: 1
                        }])
                    }
                    if (p) {
                        a(i).jqGrid("setGridParam", {
                            url: p
                        })
                    }
                    a(i).triggerHandler("jqGridToolbarAfterSearch");
                    if (a.isFunction(b.afterSearch)) {
                        b.afterSearch.call(i)
                    }
                },
                h = function(k) {
                    var m = {},
                    l = 0,
                    s;
                    k = (typeof k !== "boolean") ? true: k;
                    a.each(i.p.colModel,
                    function() {
                        var t, j = a("#gs_" + i.p.idPrefix + a.jgrid.jqID(this.name), (this.frozen === true && i.p.frozenColumns === true) ? i.grid.fhDiv: i.grid.hDiv);
                        if (this.searchoptions && this.searchoptions.defaultValue !== undefined) {
                            t = this.searchoptions.defaultValue
                        }
                        s = this.index || this.name;
                        switch (this.stype) {
                        case "select":
                            j.find("option").each(function(v) {
                                if (v === 0) {
                                    this.selected = true
                                }
                                if (a(this).val() === t) {
                                    this.selected = true;
                                    return false
                                }
                            });
                            if (t !== undefined) {
                                m[s] = t;
                                l++
                            } else {
                                try {
                                    delete i.p.postData[s]
                                } catch(u) {}
                            }
                            break;
                        case "text":
                            j.val(t || "");
                            if (t !== undefined) {
                                m[s] = t;
                                l++
                            } else {
                                try {
                                    delete i.p.postData[s]
                                } catch(w) {}
                            }
                            break;
                        case "custom":
                            if (a.isFunction(this.searchoptions.custom_value) && j.length > 0 && j[0].nodeName.toUpperCase() === "SPAN") {
                                this.searchoptions.custom_value.call(i, j.children(".customelement:first"), "set", t || "")
                            }
                            break
                        }
                    });
                    var p = l > 0 ? true: false;
                    i.p.resetsearch = true;
                    if (b.stringResult === true || i.p.datatype === "local") {
                        var q = '{"groupOp":"' + b.groupOp + '","rules":[';
                        var o = 0;
                        a.each(m,
                        function(j, t) {
                            if (o > 0) {
                                q += ","
                            }
                            q += '{"field":"' + j + '",';
                            q += '"op":"eq",';
                            t += "";
                            q += '"data":"' + t.replace(/\\/g, "\\\\").replace(/\"/g, '\\"') + '"}';
                            o++
                        });
                        q += "]}";
                        a.extend(i.p.postData, {
                            filters: q
                        });
                        a.each(["searchField", "searchString", "searchOper"],
                        function(j, t) {
                            if (i.p.postData.hasOwnProperty(t)) {
                                delete i.p.postData[t]
                            }
                        })
                    } else {
                        a.extend(i.p.postData, m)
                    }
                    var n;
                    if (i.p.searchurl) {
                        n = i.p.url;
                        a(i).jqGrid("setGridParam", {
                            url: i.p.searchurl
                        })
                    }
                    var r = a(i).triggerHandler("jqGridToolbarBeforeClear") === "stop" ? true: false;
                    if (!r && a.isFunction(b.beforeClear)) {
                        r = b.beforeClear.call(i)
                    }
                    if (!r) {
                        if (k) {
                            a(i).jqGrid("setGridParam", {
                                search: p
                            }).trigger("reloadGrid", [{
                                page: 1
                            }])
                        }
                    }
                    if (n) {
                        a(i).jqGrid("setGridParam", {
                            url: n
                        })
                    }
                    a(i).triggerHandler("jqGridToolbarAfterClear");
                    if (a.isFunction(b.afterClear)) {
                        b.afterClear()
                    }
                },
                e = function() {
                    var j = a("tr.ui-search-toolbar", i.grid.hDiv),
                    k = i.p.frozenColumns === true ? a("tr.ui-search-toolbar", i.grid.fhDiv) : false;
                    if (j.css("display") === "none") {
                        j.show();
                        if (k) {
                            k.show()
                        }
                    } else {
                        j.hide();
                        if (k) {
                            k.hide()
                        }
                    }
                },
                g = function(k, j, t) {
                    a("#sopt_menu").remove();
                    j = parseInt(j, 10);
                    t = parseInt(t, 10) + 18;
                    var p = a(".ui-jqgrid-view").css("font-size") || "11px";
                    var s = '<ul id="sopt_menu" class="ui-search-menu" role="menu" tabindex="0" style="font-size:' + p + ";left:" + j + "px;top:" + t + 'px;">',
                    n = a(k).attr("soper"),
                    r,
                    l = [],
                    m;
                    var o = 0,
                    w = a(k).attr("colname"),
                    q = i.p.colModel.length;
                    while (o < q) {
                        if (i.p.colModel[o].name === w) {
                            break
                        }
                        o++
                    }
                    var u = i.p.colModel[o],
                    v = a.extend({},
                    u.searchoptions);
                    if (!v.sopt) {
                        v.sopt = [];
                        v.sopt[0] = u.stype === "select" ? "eq": b.defaultSearch
                    }
                    a.each(b.odata,
                    function() {
                        l.push(this.oper)
                    });
                    for (o = 0; o < v.sopt.length; o++) {
                        m = a.inArray(v.sopt[o], l);
                        if (m !== -1) {
                            r = n === b.odata[m].oper ? "ui-state-highlight": "";
                            s += '<li class="ui-menu-item ' + r + '" role="presentation"><a class="ui-corner-all g-menu-item" tabindex="0" role="menuitem" value="' + b.odata[m].oper + '" oper="' + b.operands[b.odata[m].oper] + '"><table cellspacing="0" cellpadding="0" border="0"><tr><td width="25px">' + b.operands[b.odata[m].oper] + "</td><td>" + b.odata[m].text + "</td></tr></table></a></li>"
                        }
                    }
                    s += "</ul>";
                    a("body").append(s);
                    a("#sopt_menu").addClass("ui-menu ui-widget ui-widget-content ui-corner-all");
                    a("#sopt_menu > li > a").hover(function() {
                        a(this).addClass("ui-state-hover")
                    },
                    function() {
                        a(this).removeClass("ui-state-hover")
                    }).click(function(z) {
                        var y = a(this).attr("value"),
                        A = a(this).attr("oper");
                        a(i).triggerHandler("jqGridToolbarSelectOper", [y, A, k]);
                        a("#sopt_menu").hide();
                        a(k).text(A).attr("soper", y);
                        if (b.autosearch === true) {
                            var x = a(k).parent().next().children()[0];
                            if (a(x).val() || y === "nu" || y === "nn") {
                                c()
                            }
                        }
                    })
                };
                var f = a("<tr class='ui-search-toolbar' role='row'></tr>");
                var d;
                a.each(i.p.colModel,
                function(t) {
                    var q = this,
                    y, p, u, x = "",
                    H = "=",
                    C, B, n = a("<th role='columnheader' class='ui-state-default ui-th-column ui-th-" + i.p.direction + "'></th>"),
                    s = a("<div style='position:relative;height:auto;padding-right:0.3em;padding-left:0.3em;'></div>"),
                    o = a("<table class='ui-search-table' cellspacing='0'><tr><td class='ui-search-oper'></td><td class='ui-search-input'></td><td class='ui-search-clear'></td></tr></table>");
                    if (this.hidden === true) {
                        a(n).css("display", "none")
                    }
                    this.search = this.search === false ? false: true;
                    if (this.stype === undefined) {
                        this.stype = "text"
                    }
                    y = a.extend({},
                    this.searchoptions || {});
                    if (this.search) {
                        if (b.searchOperators) {
                            C = (y.sopt) ? y.sopt[0] : q.stype === "select" ? "eq": b.defaultSearch;
                            for (B = 0; B < b.odata.length; B++) {
                                if (b.odata[B].oper === C) {
                                    H = b.operands[C] || "";
                                    break
                                }
                            }
                            var z = y.searchtitle != null ? y.searchtitle: b.operandTitle;
                            x = "<a title='" + z + "' style='padding-right: 0.5em;' soper='" + C + "' class='soptclass' colname='" + this.name + "'>" + H + "</a>"
                        }
                        a("td:eq(0)", o).attr("colindex", t).append(x);
                        if (y.clearSearch === undefined) {
                            y.clearSearch = true
                        }
                        if (y.clearSearch) {
                            var r = b.resetTitle || "Clear Search Value";
                            a("td:eq(2)", o).append("<a title='" + r + "' style='padding-right: 0.3em;padding-left: 0.3em;' class='clearsearchclass'>" + b.resetIcon + "</a>")
                        } else {
                            a("td:eq(2)", o).hide()
                        }
                        switch (this.stype) {
                        case "select":
                            p = this.surl || y.dataUrl;
                            if (p) {
                                u = s;
                                a(u).append(o);
                                a.ajax(a.extend({
                                    url: p,
                                    dataType: "html",
                                    success: function(k) {
                                        if (y.buildSelect !== undefined) {
                                            var J = y.buildSelect(k);
                                            if (J) {
                                                a("td:eq(1)", o).append(J)
                                            }
                                        } else {
                                            a("td:eq(1)", o).append(k)
                                        }
                                        if (y.defaultValue !== undefined) {
                                            a("select", u).val(y.defaultValue)
                                        }
                                        a("select", u).attr({
                                            name: q.index || q.name,
                                            id: "gs_" + i.p.idPrefix + q.name
                                        });
                                        if (y.attr) {
                                            a("select", u).attr(y.attr)
                                        }
                                        a("select", u).css({
                                            width: "100%"
                                        });
                                        a.jgrid.bindEv.call(i, a("select", u)[0], y);
                                        if (b.autosearch === true) {
                                            a("select", u).change(function() {
                                                c();
                                                return false
                                            })
                                        }
                                        k = null
                                    }
                                },
                                a.jgrid.ajaxOptions, i.p.ajaxSelectOptions || {}))
                            } else {
                                var l, v, G;
                                if (q.searchoptions) {
                                    l = q.searchoptions.value === undefined ? "": q.searchoptions.value;
                                    v = q.searchoptions.separator === undefined ? ":": q.searchoptions.separator;
                                    G = q.searchoptions.delimiter === undefined ? ";": q.searchoptions.delimiter
                                } else {
                                    if (q.editoptions) {
                                        l = q.editoptions.value === undefined ? "": q.editoptions.value;
                                        v = q.editoptions.separator === undefined ? ":": q.editoptions.separator;
                                        G = q.editoptions.delimiter === undefined ? ";": q.editoptions.delimiter
                                    }
                                }
                                if (l) {
                                    var E = document.createElement("select");
                                    E.style.width = "100%";
                                    a(E).attr({
                                        name: q.index || q.name,
                                        id: "gs_" + i.p.idPrefix + q.name
                                    });
                                    var w, m, I, A;
                                    if (typeof l === "string") {
                                        C = l.split(G);
                                        for (A = 0; A < C.length; A++) {
                                            w = C[A].split(v);
                                            m = document.createElement("option");
                                            m.value = w[0];
                                            m.innerHTML = w[1];
                                            E.appendChild(m)
                                        }
                                    } else {
                                        if (typeof l === "object") {
                                            for (I in l) {
                                                if (l.hasOwnProperty(I)) {
                                                    m = document.createElement("option");
                                                    m.value = I;
                                                    m.innerHTML = l[I];
                                                    E.appendChild(m)
                                                }
                                            }
                                        }
                                    }
                                    if (y.defaultValue !== undefined) {
                                        a(E).val(y.defaultValue)
                                    }
                                    if (y.attr) {
                                        a(E).attr(y.attr)
                                    }
                                    a(s).append(o);
                                    a.jgrid.bindEv.call(i, E, y);
                                    a("td:eq(1)", o).append(E);
                                    if (b.autosearch === true) {
                                        a(E).change(function() {
                                            c();
                                            return false
                                        })
                                    }
                                }
                            }
                            break;
                        case "text":
                            var F = y.defaultValue !== undefined ? y.defaultValue: "";
                            a("td:eq(1)", o).append("<input type='text' style='width:100%;padding:0px;' name='" + (q.index || q.name) + "' id='gs_" + i.p.idPrefix + q.name + "' value='" + F + "'/>");
                            a(s).append(o);
                            if (y.attr) {
                                a("input", s).attr(y.attr)
                            }
                            a.jgrid.bindEv.call(i, a("input", s)[0], y);
                            if (b.autosearch === true) {
                                if (b.searchOnEnter) {
                                    a("input", s).keypress(function(J) {
                                        var k = J.charCode || J.keyCode || 0;
                                        if (k === 13) {
                                            c();
                                            return false
                                        }
                                        return this
                                    })
                                } else {
                                    a("input", s).keydown(function(J) {
                                        var k = J.which;
                                        switch (k) {
                                        case 13:
                                            return false;
                                        case 9:
                                        case 16:
                                        case 37:
                                        case 38:
                                        case 39:
                                        case 40:
                                        case 27:
                                            break;
                                        default:
                                            if (d) {
                                                clearTimeout(d)
                                            }
                                            d = setTimeout(function() {
                                                c()
                                            },
                                            b.autosearchDelay)
                                        }
                                    })
                                }
                            }
                            break;
                        case "custom":
                            a("td:eq(1)", o).append("<span style='width:95%;padding:0px;' name='" + (q.index || q.name) + "' id='gs_" + i.p.idPrefix + q.name + "'/>");
                            a(s).append(o);
                            try {
                                if (a.isFunction(y.custom_element)) {
                                    var j = y.custom_element.call(i, y.defaultValue !== undefined ? y.defaultValue: "", y);
                                    if (j) {
                                        j = a(j).addClass("customelement");
                                        a(s).find("span[name='" + (q.index || q.name) + "']").append(j)
                                    } else {
                                        throw "e2"
                                    }
                                } else {
                                    throw "e1"
                                }
                            } catch(D) {
                                if (D === "e1") {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_element' " + a.jgrid.edit.msg.nodefined, a.jgrid.edit.bClose)
                                }
                                if (D === "e2") {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_element' " + a.jgrid.edit.msg.novalue, a.jgrid.edit.bClose)
                                } else {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, typeof D === "string" ? D: D.message, a.jgrid.edit.bClose)
                                }
                            }
                            break
                        }
                    }
                    a(n).append(s);
                    a(f).append(n);
                    if (!b.searchOperators) {
                        a("td:eq(0)", o).hide()
                    }
                });
                a("table thead", i.grid.hDiv).append(f);
                if (b.searchOperators) {
                    a(".soptclass", f).click(function(l) {
                        var m = a(this).offset(),
                        k = (m.left),
                        j = (m.top);
                        g(this, k, j);
                        l.stopPropagation()
                    });
                    a("body").on("click",
                    function(j) {
                        if (j.target.className !== "soptclass") {
                            a("#sopt_menu").hide()
                        }
                    })
                }
                a(".clearsearchclass", f).click(function(m) {
                    var n = a(this).parents("tr:first"),
                    l = parseInt(a("td.ui-search-oper", n).attr("colindex"), 10),
                    j = a.extend({},
                    i.p.colModel[l].searchoptions || {}),
                    k = j.defaultValue ? j.defaultValue: "";
                    if (i.p.colModel[l].stype === "select") {
                        if (k) {
                            a("td.ui-search-input select", n).val(k)
                        } else {
                            a("td.ui-search-input select", n)[0].selectedIndex = 0
                        }
                    } else {
                        a("td.ui-search-input input", n).val(k)
                    }
                    if (b.autosearch === true) {
                        c()
                    }
                });
                this.ftoolbar = true;
                this.triggerToolbar = c;
                this.clearToolbar = h;
                this.toggleToolbar = e
            })
        },
        destroyFilterToolbar: function() {
            return this.each(function() {
                if (!this.ftoolbar) {
                    return
                }
                this.triggerToolbar = null;
                this.clearToolbar = null;
                this.toggleToolbar = null;
                this.ftoolbar = false;
                a(this.grid.hDiv).find("table thead tr.ui-search-toolbar").remove()
            })
        },
        destroyGroupHeader: function(b) {
            if (b === undefined) {
                b = true
            }
            return this.each(function() {
                var h = this,
                m, j, f, d, p, e, c = h.grid,
                n = a("table.ui-jqgrid-htable thead", c.hDiv),
                o = h.p.colModel,
                k;
                if (!c) {
                    return
                }
                a(this).unbind(".setGroupHeaders");
                m = a("<tr>", {
                    role: "row"
                }).addClass("ui-jqgrid-labels");
                d = c.headers;
                for (j = 0, f = d.length; j < f; j++) {
                    k = o[j].hidden ? "none": "";
                    p = a(d[j].el).width(d[j].width).css("display", k);
                    try {
                        p.removeAttr("rowSpan")
                    } catch(g) {
                        p.attr("rowSpan", 1)
                    }
                    m.append(p);
                    e = p.children("span.ui-jqgrid-resize");
                    if (e.length > 0) {
                        e[0].style.height = ""
                    }
                    p.children("div")[0].style.top = ""
                }
                a(n).children("tr.ui-jqgrid-labels").remove();
                a(n).prepend(m);
                if (b === true) {
                    a(h).jqGrid("setGridParam", {
                        groupHeader: null
                    })
                }
            })
        },
        setGroupHeaders: function(b) {
            b = a.extend({
                useColSpanStyle: false,
                groupHeaders: []
            },
            b || {});
            return this.each(function() {
                this.p.groupHeader = b;
                var c = this,
                y, u, v = 0,
                A, o, j, f, h, g, z, q, p, t, n = c.p.colModel,
                r = n.length,
                d = c.grid.headers,
                x = a("table.ui-jqgrid-htable", c.grid.hDiv),
                e = x.children("thead").children("tr.ui-jqgrid-labels:last").addClass("jqg-second-row-header"),
                m = x.children("thead"),
                s,
                l = x.find(".jqg-first-row-header");
                if (l[0] === undefined) {
                    l = a("<tr>", {
                        role: "row",
                        "aria-hidden": "true"
                    }).addClass("jqg-first-row-header").css("height", "auto")
                } else {
                    l.empty()
                }
                var k, w = function(E, C) {
                    var D = C.length,
                    B;
                    for (B = 0; B < D; B++) {
                        if (C[B].startColumnName === E) {
                            return B
                        }
                    }
                    return - 1
                };
                a(c).prepend(m);
                A = a("<tr>", {
                    role: "row"
                }).addClass("ui-jqgrid-labels jqg-third-row-header");
                for (y = 0; y < r; y++) {
                    j = d[y].el;
                    f = a(j);
                    u = n[y];
                    h = {
                        height: "0px",
                        width: d[y].width + "px",
                        display: (u.hidden ? "none": "")
                    };
                    a("<th>", {
                        role: "gridcell"
                    }).css(h).addClass("ui-first-th-" + c.p.direction).appendTo(l);
                    j.style.width = "";
                    g = w(u.name, b.groupHeaders);
                    if (g >= 0) {
                        z = b.groupHeaders[g];
                        q = z.numberOfColumns;
                        p = z.titleText;
                        for (t = 0, g = 0; g < q && (y + g < r); g++) {
                            if (!n[y + g].hidden) {
                                t++
                            }
                        }
                        o = a("<th>").attr({
                            role: "columnheader"
                        }).addClass("ui-state-default ui-th-column-header ui-th-" + c.p.direction + " " + (z.classes || "")).css({
                            height: "22px",
                            "border-top": "0 none"
                        }).html(p);
                        if (t > 0) {
                            o.attr("colspan", String(t))
                        }
                        if (c.p.headertitles) {
                            o.attr("title", o.text())
                        }
                        if (t === 0) {
                            o.hide()
                        }
                        f.before(o);
                        A.append(j);
                        v = q - 1
                    } else {
                        if (v === 0) {
                            if (b.useColSpanStyle) {
                                f.attr("rowspan", "2")
                            } else {
                                a("<th>", {
                                    role: "columnheader"
                                }).addClass("ui-state-default ui-th-column-header ui-th-" + c.p.direction).css({
                                    display: u.hidden ? "none": "",
                                    "border-top": "0 none"
                                }).insertBefore(f);
                                A.append(j)
                            }
                        } else {
                            A.append(j);
                            v--
                        }
                    }
                }
                s = a(c).children("thead");
                s.prepend(l);
                A.insertAfter(e);
                x.append(s);
                if (b.useColSpanStyle) {
                    x.find("span.ui-jqgrid-resize").each(function() {
                        var i = a(this).parent();
                        if (i.is(":visible")) {
                            this.style.cssText = "height: " + (i.height() + 2) + "px !important; cursor: col-resize;"
                        }
                    });
                    x.find("div.ui-jqgrid-sortable").each(function() {
                        var i = a(this),
                        B = i.parent();
                        if (B.is(":visible") && B.is(":has(span.ui-jqgrid-resize)")) {
                            i.css("top", (B.height() - i.outerHeight()) / 2 + "px")
                        }
                    })
                }
                k = s.find("tr.jqg-first-row-header");
                a(c).bind("jqGridResizeStop.setGroupHeaders",
                function(C, B, i) {
                    k.find("th").eq(i).width(B)
                })
            })
        },
        setFrozenColumns: function() {
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var h = this,
                q = h.p.colModel,
                j = 0,
                l = q.length,
                o = -1,
                b = false;
                if (h.p.subGrid === true || h.p.treeGrid === true || h.p.cellEdit === true || h.p.sortable || h.p.scroll) {
                    return
                }
                if (h.p.rownumbers) {
                    j++
                }
                if (h.p.multiselect) {
                    j++
                }
                while (j < l) {
                    if (q[j].frozen === true) {
                        b = true;
                        o = j
                    } else {
                        break
                    }
                    j++
                }
                if (o >= 0 && b) {
                    var m = h.p.caption ? a(h.grid.cDiv).outerHeight() : 0,
                    n = a(".ui-jqgrid-htable", "#gview_" + a.jgrid.jqID(h.p.id)).height();
                    if (h.p.toppager) {
                        m = m + a(h.grid.topDiv).outerHeight()
                    }
                    if (h.p.toolbar[0] === true) {
                        if (h.p.toolbar[1] !== "bottom") {
                            m = m + a(h.grid.uDiv).outerHeight()
                        }
                    }
                    h.grid.fhDiv = a('<div style="position:absolute;left:0px;top:' + m + "px;height2:" + n + 'px;" class="frozen-div ui-state-default ui-jqgrid-hdiv"></div>');
                    h.grid.fbDiv = a('<div style="position:absolute;left:0px;top:' + (parseInt(m, 10) + parseInt(n, 10) + 0) + 'px;overflow:hidden" class="frozen-bdiv ui-jqgrid-bdiv"></div>');
                    a("#gview_" + a.jgrid.jqID(h.p.id)).append(h.grid.fhDiv);
                    var f = a(".ui-jqgrid-htable", "#gview_" + a.jgrid.jqID(h.p.id)).clone(true);
                    if (h.p.groupHeader) {
                        a("tr.jqg-first-row-header, tr.jqg-third-row-header", f).each(function() {
                            a("th:gt(" + o + ")", this).remove()
                        });
                        var c = -1,
                        e = -1,
                        k, g;
                        a("tr.jqg-second-row-header th", f).each(function() {
                            k = parseInt(a(this).attr("colspan"), 10);
                            g = parseInt(a(this).attr("rowspan"), 10);
                            if (g) {
                                c++;
                                e++
                            }
                            if (k) {
                                c = c + k;
                                e++
                            }
                            if (c === o) {
                                return false
                            }
                        });
                        if (c !== o) {
                            e = o
                        }
                        a("tr.jqg-second-row-header", f).each(function() {
                            a("th:gt(" + e + ")", this).remove()
                        })
                    } else {
                        a("tr", f).each(function() {
                            a("th:gt(" + o + ")", this).remove()
                        })
                    }
                    a(f).width(1);
                    a(h.grid.fhDiv).append(f).mousemove(function(i) {
                        if (h.grid.resizing) {
                            h.grid.dragMove(i);
                            return false
                        }
                    });
                    if (h.p.footerrow) {
                        var d = a(".ui-jqgrid-bdiv", "#gview_" + a.jgrid.jqID(h.p.id)).height();
                        h.grid.fsDiv = a('<div style="position:absolute;left:0px;bottom:0px;" class="frozen-sdiv ui-jqgrid-sdiv"></div>');
                        a("#gview_" + a.jgrid.jqID(h.p.id)).append(h.grid.fsDiv);
                        var p = a(".ui-jqgrid-ftable", "#gview_" + a.jgrid.jqID(h.p.id)).clone(true);
                        a("tr", p).each(function() {
                            a("td:gt(" + o + ")", this).remove()
                        });
                        a(p).width(1);
                        a(h.grid.fsDiv).append(p)
                    }
                    a(h).bind("jqGridResizeStop.setFrozenColumns",
                    function(u, i, s) {
                        var t = a(".ui-jqgrid-htable", h.grid.fhDiv);
                        a("th:eq(" + s + ")", t).width(i);
                        var r = a(".ui-jqgrid-btable", h.grid.fbDiv);
                        a("tr:first td:eq(" + s + ")", r).width(i);
                        if (h.p.footerrow) {
                            var v = a(".ui-jqgrid-ftable", h.grid.fsDiv);
                            a("tr:first td:eq(" + s + ")", v).width(i)
                        }
                    });
                    a(h).bind("jqGridSortCol.setFrozenColumns",
                    function(u, r, t) {
                        var i = a("tr.ui-jqgrid-labels:last th:eq(" + h.p.lastsort + ")", h.grid.fhDiv),
                        s = a("tr.ui-jqgrid-labels:last th:eq(" + t + ")", h.grid.fhDiv);
                        a("span.ui-grid-ico-sort", i).addClass("ui-state-disabled");
                        a(i).attr("aria-selected", "false");
                        a("span.ui-icon-" + h.p.sortorder, s).removeClass("ui-state-disabled");
                        a(s).attr("aria-selected", "true");
                        if (!h.p.viewsortcols[0]) {
                            if (h.p.lastsort !== t) {
                                a("span.s-ico", i).hide();
                                a("span.s-ico", s).show()
                            }
                        }
                    });
                    a("#gview_" + a.jgrid.jqID(h.p.id)).append(h.grid.fbDiv);
                    a(h.grid.bDiv).scroll(function() {
                        a(h.grid.fbDiv).scrollTop(a(this).scrollTop())
                    });
                    if (h.p.hoverrows === true) {
                        a("#" + a.jgrid.jqID(h.p.id)).unbind("mouseover").unbind("mouseout")
                    }
                    a(h).bind("jqGridAfterGridComplete.setFrozenColumns",
                    function() {
                        a("#" + a.jgrid.jqID(h.p.id) + "_frozen").remove();
                        a(h.grid.fhDiv).height(a(h.grid.hDiv).height());
                        a(h.grid.fbDiv).height(a(h.grid.bDiv).height() - 16 + (a.jgrid.msie || a.jgrid.msie11 ? 0 : 4));
                        var i = a("#" + a.jgrid.jqID(h.p.id)).clone(true);
                        a("tr[role=row]", i).each(function() {
                            a("td[role=gridcell]:gt(" + o + ")", this).remove()
                        });
                        a(i).width(1).attr("id", h.p.id + "_frozen");
                        a(h.grid.fbDiv).append(i);
                        if (h.p.hoverrows === true) {
                            a("tr.jqgrow", i).hover(function() {
                                a(this).addClass("ui-state-hover");
                                a("#" + a.jgrid.jqID(this.id), "#" + a.jgrid.jqID(h.p.id)).addClass("ui-state-hover")
                            },
                            function() {
                                a(this).removeClass("ui-state-hover");
                                a("#" + a.jgrid.jqID(this.id), "#" + a.jgrid.jqID(h.p.id)).removeClass("ui-state-hover")
                            });
                            a("tr.jqgrow", "#" + a.jgrid.jqID(h.p.id)).hover(function() {
                                a(this).addClass("ui-state-hover");
                                a("#" + a.jgrid.jqID(this.id), "#" + a.jgrid.jqID(h.p.id) + "_frozen").addClass("ui-state-hover")
                            },
                            function() {
                                a(this).removeClass("ui-state-hover");
                                a("#" + a.jgrid.jqID(this.id), "#" + a.jgrid.jqID(h.p.id) + "_frozen").removeClass("ui-state-hover")
                            })
                        }
                        i = null
                    });
                    if (!h.grid.hDiv.loading) {
                        a(h).triggerHandler("jqGridAfterGridComplete")
                    }
                    h.p.frozenColumns = true
                }
            })
        },
        destroyFrozenColumns: function() {
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                if (this.p.frozenColumns === true) {
                    var c = this;
                    a(c.grid.fhDiv).remove();
                    a(c.grid.fbDiv).remove();
                    c.grid.fhDiv = null;
                    c.grid.fbDiv = null;
                    if (c.p.footerrow) {
                        a(c.grid.fsDiv).remove();
                        c.grid.fsDiv = null
                    }
                    a(this).unbind(".setFrozenColumns");
                    if (c.p.hoverrows === true) {
                        var b;
                        a("#" + a.jgrid.jqID(c.p.id)).bind("mouseover",
                        function(d) {
                            b = a(d.target).closest("tr.jqgrow");
                            if (a(b).attr("class") !== "ui-subgrid") {
                                a(b).addClass("ui-state-hover")
                            }
                        }).bind("mouseout",
                        function(d) {
                            b = a(d.target).closest("tr.jqgrow");
                            a(b).removeClass("ui-state-hover")
                        })
                    }
                    this.p.frozenColumns = false
                }
            })
        }
    })
})(jQuery); (function(a) {
    a.fn.jqFilter = function(b) {
        if (typeof b === "string") {
            var d = a.fn.jqFilter[b];
            if (!d) {
                throw ("jqFilter - No such method: " + b)
            }
            var c = a.makeArray(arguments).slice(1);
            return d.apply(this, c)
        }
        var e = a.extend(true, {
            filter: null,
            columns: [],
            onChange: null,
            afterRedraw: null,
            checkValues: null,
            error: false,
            errmsg: "",
            errorcheck: true,
            showQuery: true,
            sopt: null,
            ops: [],
            operands: null,
            numopts: ["eq", "ne", "lt", "le", "gt", "ge", "nu", "nn", "in", "ni"],
            stropts: ["eq", "ne", "bw", "bn", "ew", "en", "cn", "nc", "nu", "nn", "in", "ni"],
            strarr: ["text", "string", "blob"],
            groupOps: [{
                op: "AND",
                text: "AND"
            },
            {
                op: "OR",
                text: "OR"
            }],
            groupButton: true,
            ruleButtons: true,
            direction: "ltr"
        },
        a.jgrid.filter, b || {});
        return this.each(function() {
            if (this.filter) {
                return
            }
            this.p = e;
            if (this.p.filter === null || this.p.filter === undefined) {
                this.p.filter = {
                    groupOp: this.p.groupOps[0].op,
                    rules: [],
                    groups: []
                }
            }
            var j, f = this.p.columns.length,
            g, k = /msie/i.test(navigator.userAgent) && !window.opera;
            this.p.initFilter = a.extend(true, {},
            this.p.filter);
            if (!f) {
                return
            }
            for (j = 0; j < f; j++) {
                g = this.p.columns[j];
                if (g.stype) {
                    g.inputtype = g.stype
                } else {
                    if (!g.inputtype) {
                        g.inputtype = "text"
                    }
                }
                if (g.sorttype) {
                    g.searchtype = g.sorttype
                } else {
                    if (!g.searchtype) {
                        g.searchtype = "string"
                    }
                }
                if (g.hidden === undefined) {
                    g.hidden = false
                }
                if (!g.label) {
                    g.label = g.name
                }
                if (g.index) {
                    g.name = g.index
                }
                if (!g.hasOwnProperty("searchoptions")) {
                    g.searchoptions = {}
                }
                if (!g.hasOwnProperty("searchrules")) {
                    g.searchrules = {}
                }
            }
            if (this.p.showQuery) {
                a(this).append("<table class='queryresult ui-widget ui-widget-content' style='display:block;max-width:440px;border:0px none;' dir='" + this.p.direction + "'><tbody><tr><td class='query'></td></tr></tbody></table>")
            }
            var l = function() {
                return a("#" + a.jgrid.jqID(e.id))[0] || null
            };
            var h = function(o, i) {
                var m = [true, ""],
                p = l();
                if (a.isFunction(i.searchrules)) {
                    m = i.searchrules.call(p, o, i)
                } else {
                    if (a.jgrid && a.jgrid.checkValues) {
                        try {
                            m = a.jgrid.checkValues.call(p, o, -1, i.searchrules, i.label)
                        } catch(n) {}
                    }
                }
                if (m && m.length && m[0] === false) {
                    e.error = !m[0];
                    e.errmsg = m[1]
                }
            };
            this.onchange = function() {
                this.p.error = false;
                this.p.errmsg = "";
                return a.isFunction(this.p.onChange) ? this.p.onChange.call(this, this.p) : false
            };
            this.reDraw = function() {
                a("table.group:first", this).remove();
                var i = this.createTableForGroup(e.filter, null);
                a(this).append(i);
                if (a.isFunction(this.p.afterRedraw)) {
                    this.p.afterRedraw.call(this, this.p)
                }
            };
            this.createTableForGroup = function(p, A) {
                var o = this,
                y;
                var z = a("<table class='group ui-widget ui-widget-content' style='border:0px none;'><tbody></tbody></table>"),
                w = "left";
                if (this.p.direction === "rtl") {
                    w = "right";
                    z.attr("dir", "rtl")
                }
                if (A === null) {
                    z.append("<tr class='error' style='display:none;'><th colspan='5' class='ui-state-error' align='" + w + "'></th></tr>")
                }
                var m = a("<tr></tr>");
                z.append(m);
                var n = a("<th colspan='5' align='" + w + "'></th>");
                m.append(n);
                if (this.p.ruleButtons === true) {
                    var t = a("<select class='opsel'></select>");
                    n.append(t);
                    var v = "",
                    u;
                    for (y = 0; y < e.groupOps.length; y++) {
                        u = p.groupOp === o.p.groupOps[y].op ? " selected='selected'": "";
                        v += "<option value='" + o.p.groupOps[y].op + "'" + u + ">" + o.p.groupOps[y].text + "</option>"
                    }
                    t.append(v).bind("change",
                    function() {
                        p.groupOp = a(t).val();
                        o.onchange()
                    })
                }
                var D = "<span></span>";
                if (this.p.groupButton) {
                    D = a("<input type='button' value='+ {}' title='Add subgroup' class='add-group'/>");
                    D.bind("click",
                    function() {
                        if (p.groups === undefined) {
                            p.groups = []
                        }
                        p.groups.push({
                            groupOp: e.groupOps[0].op,
                            rules: [],
                            groups: []
                        });
                        o.reDraw();
                        o.onchange();
                        return false
                    })
                }
                n.append(D);
                if (this.p.ruleButtons === true) {
                    var r = a("<input type='button' value='+' title='Add rule' class='add-rule ui-add'/>"),
                    q;
                    r.bind("click",
                    function() {
                        if (p.rules === undefined) {
                            p.rules = []
                        }
                        for (y = 0; y < o.p.columns.length; y++) {
                            var i = (o.p.columns[y].search === undefined) ? true: o.p.columns[y].search,
                            G = (o.p.columns[y].hidden === true),
                            F = (o.p.columns[y].searchoptions.searchhidden === true);
                            if ((F && i) || (i && !G)) {
                                q = o.p.columns[y];
                                break
                            }
                        }
                        var E;
                        if (q.searchoptions.sopt) {
                            E = q.searchoptions.sopt
                        } else {
                            if (o.p.sopt) {
                                E = o.p.sopt
                            } else {
                                if (a.inArray(q.searchtype, o.p.strarr) !== -1) {
                                    E = o.p.stropts
                                } else {
                                    E = o.p.numopts
                                }
                            }
                        }
                        p.rules.push({
                            field: q.name,
                            op: E[0],
                            data: ""
                        });
                        o.reDraw();
                        return false
                    });
                    n.append(r)
                }
                if (A !== null) {
                    var s = a("<input type='button' value='-' title='Delete group' class='delete-group'/>");
                    n.append(s);
                    s.bind("click",
                    function() {
                        for (y = 0; y < A.groups.length; y++) {
                            if (A.groups[y] === p) {
                                A.groups.splice(y, 1);
                                break
                            }
                        }
                        o.reDraw();
                        o.onchange();
                        return false
                    })
                }
                if (p.groups !== undefined) {
                    for (y = 0; y < p.groups.length; y++) {
                        var x = a("<tr></tr>");
                        z.append(x);
                        var B = a("<td class='first'></td>");
                        x.append(B);
                        var C = a("<td colspan='4'></td>");
                        C.append(this.createTableForGroup(p.groups[y], p));
                        x.append(C)
                    }
                }
                if (p.groupOp === undefined) {
                    p.groupOp = o.p.groupOps[0].op
                }
                if (p.rules !== undefined) {
                    for (y = 0; y < p.rules.length; y++) {
                        z.append(this.createTableRowForRule(p.rules[y], p))
                    }
                }
                return z
            };
            this.createTableRowForRule = function(v, x) {
                var w = this,
                I = l(),
                n = a("<tr></tr>"),
                H,
                z,
                p,
                y,
                C = "",
                B;
                n.append("<td class='first'></td>");
                var q = a("<td class='columns'></td>");
                n.append(q);
                var J = a("<select></select>"),
                A,
                E = [];
                q.append(J);
                J.bind("change",
                function() {
                    v.field = a(J).val();
                    p = a(this).parents("tr:first");
                    for (H = 0; H < w.p.columns.length; H++) {
                        if (w.p.columns[H].name === v.field) {
                            y = w.p.columns[H];
                            break
                        }
                    }
                    if (!y) {
                        return
                    }
                    y.searchoptions.id = a.jgrid.randId();
                    if (k && y.inputtype === "text") {
                        if (!y.searchoptions.size) {
                            y.searchoptions.size = 10
                        }
                    }
                    var N = a.jgrid.createEl.call(I, y.inputtype, y.searchoptions, "", true, w.p.ajaxSelectOptions || {},
                    true);
                    a(N).addClass("input-elm");
                    if (y.searchoptions.sopt) {
                        z = y.searchoptions.sopt
                    } else {
                        if (w.p.sopt) {
                            z = w.p.sopt
                        } else {
                            if (a.inArray(y.searchtype, w.p.strarr) !== -1) {
                                z = w.p.stropts
                            } else {
                                z = w.p.numopts
                            }
                        }
                    }
                    var L = "",
                    M = 0;
                    E = [];
                    a.each(w.p.ops,
                    function() {
                        E.push(this.oper)
                    });
                    for (H = 0; H < z.length; H++) {
                        A = a.inArray(z[H], E);
                        if (A !== -1) {
                            if (M === 0) {
                                v.op = w.p.ops[A].oper
                            }
                            L += "<option value='" + w.p.ops[A].oper + "'>" + w.p.ops[A].text + "</option>";
                            M++
                        }
                    }
                    a(".selectopts", p).empty().append(L);
                    a(".selectopts", p)[0].selectedIndex = 0;
                    if (a.jgrid.msie && a.jgrid.msiever() < 9) {
                        var i = parseInt(a("select.selectopts", p)[0].offsetWidth, 10) + 1;
                        a(".selectopts", p).width(i);
                        a(".selectopts", p).css("width", "auto")
                    }
                    a(".data", p).empty().append(N);
                    a.jgrid.bindEv.call(I, N, y.searchoptions);
                    a(".input-elm", p).bind("change",
                    function(P) {
                        var O = P.target;
                        v.data = O.nodeName.toUpperCase() === "SPAN" && y.searchoptions && a.isFunction(y.searchoptions.custom_value) ? y.searchoptions.custom_value.call(I, a(O).children(".customelement:first"), "get") : O.value;
                        w.onchange()
                    });
                    setTimeout(function() {
                        v.data = a(N).val();
                        w.onchange()
                    },
                    0)
                });
                var F = 0;
                for (H = 0; H < w.p.columns.length; H++) {
                    var t = (w.p.columns[H].search === undefined) ? true: w.p.columns[H].search,
                    G = (w.p.columns[H].hidden === true),
                    K = (w.p.columns[H].searchoptions.searchhidden === true);
                    if ((K && t) || (t && !G)) {
                        B = "";
                        if (v.field === w.p.columns[H].name) {
                            B = " selected='selected'";
                            F = H
                        }
                        C += "<option value='" + w.p.columns[H].name + "'" + B + ">" + w.p.columns[H].label + "</option>"
                    }
                }
                J.append(C);
                var D = a("<td class='operators'></td>");
                n.append(D);
                y = e.columns[F];
                y.searchoptions.id = a.jgrid.randId();
                if (k && y.inputtype === "text") {
                    if (!y.searchoptions.size) {
                        y.searchoptions.size = 10
                    }
                }
                var o = a.jgrid.createEl.call(I, y.inputtype, y.searchoptions, v.data, true, w.p.ajaxSelectOptions || {},
                true);
                if (v.op === "nu" || v.op === "nn") {
                    a(o).attr("readonly", "true");
                    a(o).attr("disabled", "true")
                }
                var m = a("<select class='selectopts'></select>");
                D.append(m);
                m.bind("change",
                function() {
                    v.op = a(m).val();
                    p = a(this).parents("tr:first");
                    var i = a(".input-elm", p)[0];
                    if (v.op === "nu" || v.op === "nn") {
                        v.data = "";
                        if (i.tagName.toUpperCase() !== "SELECT") {
                            i.value = ""
                        }
                        i.setAttribute("readonly", "true");
                        i.setAttribute("disabled", "true")
                    } else {
                        if (i.tagName.toUpperCase() === "SELECT") {
                            v.data = i.value
                        }
                        i.removeAttribute("readonly");
                        i.removeAttribute("disabled")
                    }
                    w.onchange()
                });
                if (y.searchoptions.sopt) {
                    z = y.searchoptions.sopt
                } else {
                    if (w.p.sopt) {
                        z = w.p.sopt
                    } else {
                        if (a.inArray(y.searchtype, w.p.strarr) !== -1) {
                            z = w.p.stropts
                        } else {
                            z = w.p.numopts
                        }
                    }
                }
                C = "";
                a.each(w.p.ops,
                function() {
                    E.push(this.oper)
                });
                for (H = 0; H < z.length; H++) {
                    A = a.inArray(z[H], E);
                    if (A !== -1) {
                        B = v.op === w.p.ops[A].oper ? " selected='selected'": "";
                        C += "<option value='" + w.p.ops[A].oper + "'" + B + ">" + w.p.ops[A].text + "</option>"
                    }
                }
                m.append(C);
                var s = a("<td class='data'></td>");
                n.append(s);
                s.append(o);
                a.jgrid.bindEv.call(I, o, y.searchoptions);
                a(o).addClass("input-elm").bind("change",
                function() {
                    v.data = y.inputtype === "custom" ? y.searchoptions.custom_value.call(I, a(this).children(".customelement:first"), "get") : a(this).val();
                    w.onchange()
                });
                var u = a("<td></td>");
                n.append(u);
                if (this.p.ruleButtons === true) {
                    var r = a("<input type='button' value='-' title='Delete rule' class='delete-rule ui-del'/>");
                    u.append(r);
                    r.bind("click",
                    function() {
                        for (H = 0; H < x.rules.length; H++) {
                            if (x.rules[H] === v) {
                                x.rules.splice(H, 1);
                                break
                            }
                        }
                        w.reDraw();
                        w.onchange();
                        return false
                    })
                }
                return n
            };
            this.getStringForGroup = function(o) {
                var m = "(",
                i;
                if (o.groups !== undefined) {
                    for (i = 0; i < o.groups.length; i++) {
                        if (m.length > 1) {
                            m += " " + o.groupOp + " "
                        }
                        try {
                            m += this.getStringForGroup(o.groups[i])
                        } catch(p) {
                            alert(p)
                        }
                    }
                }
                if (o.rules !== undefined) {
                    try {
                        for (i = 0; i < o.rules.length; i++) {
                            if (m.length > 1) {
                                m += " " + o.groupOp + " "
                            }
                            m += this.getStringForRule(o.rules[i])
                        }
                    } catch(n) {
                        alert(n)
                    }
                }
                m += ")";
                if (m === "()") {
                    return ""
                }
                return m
            };
            this.getStringForRule = function(r) {
                var o = "",
                t = "",
                q, n, p, s, m = ["int", "integer", "float", "number", "currency"];
                for (q = 0; q < this.p.ops.length; q++) {
                    if (this.p.ops[q].oper === r.op) {
                        o = this.p.operands.hasOwnProperty(r.op) ? this.p.operands[r.op] : "";
                        t = this.p.ops[q].oper;
                        break
                    }
                }
                for (q = 0; q < this.p.columns.length; q++) {
                    if (this.p.columns[q].name === r.field) {
                        n = this.p.columns[q];
                        break
                    }
                }
                if (n == undefined) {
                    return ""
                }
                s = r.data;
                if (t === "bw" || t === "bn") {
                    s = s + "%"
                }
                if (t === "ew" || t === "en") {
                    s = "%" + s
                }
                if (t === "cn" || t === "nc") {
                    s = "%" + s + "%"
                }
                if (t === "in" || t === "ni") {
                    s = " (" + s + ")"
                }
                if (e.errorcheck) {
                    h(r.data, n)
                }
                if (a.inArray(n.searchtype, m) !== -1 || t === "nn" || t === "nu") {
                    p = r.field + " " + o + " " + s
                } else {
                    p = r.field + " " + o + ' "' + s + '"'
                }
                return p
            };
            this.resetFilter = function() {
                this.p.filter = a.extend(true, {},
                this.p.initFilter);
                this.reDraw();
                this.onchange()
            };
            this.hideError = function() {
                a("th.ui-state-error", this).html("");
                a("tr.error", this).hide()
            };
            this.showError = function() {
                a("th.ui-state-error", this).html(this.p.errmsg);
                a("tr.error", this).show()
            };
            this.toUserFriendlyString = function() {
                return this.getStringForGroup(e.filter)
            };
            this.toString = function() {
                var m = this;
                function n(q) {
                    if (m.p.errorcheck) {
                        var p, o;
                        for (p = 0; p < m.p.columns.length; p++) {
                            if (m.p.columns[p].name === q.field) {
                                o = m.p.columns[p];
                                break
                            }
                        }
                        if (o) {
                            h(q.data, o)
                        }
                    }
                    return q.op + "(item." + q.field + ",'" + q.data + "')"
                }
                function i(q) {
                    var p = "(",
                    o;
                    if (q.groups !== undefined) {
                        for (o = 0; o < q.groups.length; o++) {
                            if (p.length > 1) {
                                if (q.groupOp === "OR") {
                                    p += " || "
                                } else {
                                    p += " && "
                                }
                            }
                            p += i(q.groups[o])
                        }
                    }
                    if (q.rules !== undefined) {
                        for (o = 0; o < q.rules.length; o++) {
                            if (p.length > 1) {
                                if (q.groupOp === "OR") {
                                    p += " || "
                                } else {
                                    p += " && "
                                }
                            }
                            p += n(q.rules[o])
                        }
                    }
                    p += ")";
                    if (p === "()") {
                        return ""
                    }
                    return p
                }
                return i(this.p.filter)
            };
            this.reDraw();
            if (this.p.showQuery) {
                this.onchange()
            }
            this.filter = true
        })
    };
    a.extend(a.fn.jqFilter, {
        toSQLString: function() {
            var b = "";
            this.each(function() {
                b = this.toUserFriendlyString()
            });
            return b
        },
        filterData: function() {
            var b;
            this.each(function() {
                b = this.p.filter
            });
            return b
        },
        getParameter: function(b) {
            if (b !== undefined) {
                if (this.p.hasOwnProperty(b)) {
                    return this.p[b]
                }
            }
            return this.p
        },
        resetFilter: function() {
            return this.each(function() {
                this.resetFilter()
            })
        },
        addFilter: function(b) {
            if (typeof b === "string") {
                b = a.jgrid.parse(b)
            }
            this.each(function() {
                this.p.filter = b;
                this.reDraw();
                this.onchange()
            })
        }
    })
})(jQuery); (function(b) {
    var a = {};
    b.jgrid.extend({
        searchGrid: function(c) {
            c = b.extend(true, {
                recreateFilter: false,
                drag: true,
                sField: "searchField",
                sValue: "searchString",
                sOper: "searchOper",
                sFilter: "filters",
                loadDefaults: true,
                beforeShowSearch: null,
                afterShowSearch: null,
                onInitializeSearch: null,
                afterRedraw: null,
                afterChange: null,
                closeAfterSearch: false,
                closeAfterReset: false,
                closeOnEscape: false,
                searchOnEnter: false,
                multipleSearch: false,
                multipleGroup: false,
                top: 0,
                left: 0,
                jqModal: true,
                modal: false,
                resize: true,
                width: 450,
                height: "auto",
                dataheight: "auto",
                showQuery: false,
                errorcheck: true,
                sopt: null,
                stringResult: undefined,
                onClose: null,
                onSearch: null,
                onReset: null,
                toTop: true,
                overlay: 30,
                columns: [],
                tmplNames: null,
                tmplFilters: null,
                tmplLabel: " Template: ",
                showOnLoad: false,
                layer: null,
                operands: {
                    eq: "=",
                    ne: "<>",
                    lt: "<",
                    le: "<=",
                    gt: ">",
                    ge: ">=",
                    bw: "LIKE",
                    bn: "NOT LIKE",
                    "in": "IN",
                    ni: "NOT IN",
                    ew: "LIKE",
                    en: "NOT LIKE",
                    cn: "LIKE",
                    nc: "NOT LIKE",
                    nu: "IS NULL",
                    nn: "ISNOT NULL"
                }
            },
            b.jgrid.search, c || {});
            return this.each(function() {
                var u = this;
                if (!u.grid) {
                    return
                }
                var d = "fbox_" + u.p.id,
                i = true,
                n = true,
                f = {
                    themodal: "searchmod" + d,
                    modalhead: "searchhd" + d,
                    modalcontent: "searchcnt" + d,
                    scrollelm: d
                },
                g = u.p.postData[c.sFilter],
                l;
                if (typeof g === "string") {
                    g = b.jgrid.parse(g)
                }
                if (c.recreateFilter === true) {
                    b("#" + b.jgrid.jqID(f.themodal)).remove()
                }
                function h(y) {
                    i = b(u).triggerHandler("jqGridFilterBeforeShow", [y]);
                    if (i === undefined) {
                        i = true
                    }
                    if (i && b.isFunction(c.beforeShowSearch)) {
                        i = c.beforeShowSearch.call(u, y)
                    }
                    if (i) {
                        b.jgrid.viewModal("#" + b.jgrid.jqID(f.themodal), {
                            gbox: "#gbox_" + b.jgrid.jqID(d),
                            jqm: c.jqModal,
                            modal: c.modal,
                            overlay: c.overlay,
                            toTop: c.toTop
                        });
                        b(u).triggerHandler("jqGridFilterAfterShow", [y]);
                        if (b.isFunction(c.afterShowSearch)) {
                            c.afterShowSearch.call(u, y)
                        }
                    }
                }
                if (b("#" + b.jgrid.jqID(f.themodal))[0] !== undefined) {
                    h(b("#fbox_" + b.jgrid.jqID( + u.p.id)))
                } else {
                    var v = b("<div><div id='" + d + "' class='searchFilter' style='overflow:auto'></div></div>").insertBefore("#gview_" + b.jgrid.jqID(u.p.id)),
                    t = "left",
                    j = "";
                    if (u.p.direction === "rtl") {
                        t = "right";
                        j = " style='text-align:left'";
                        v.attr("dir", "rtl")
                    }
                    var e = b.extend([], u.p.colModel),
                    q = "<a id='" + d + "_search' class='fm-button ui-state-default ui-corner-all fm-button-icon-right ui-reset'><span class='ui-icon ui-icon-search'></span>" + c.Find + "</a>",
                    x = "<a id='" + d + "_reset' class='fm-button ui-state-default ui-corner-all fm-button-icon-left ui-search'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>" + c.Reset + "</a>",
                    s = "",
                    k = "",
                    o,
                    p = false,
                    w,
                    r = -1;
                    if (c.showQuery) {
                        s = "<a id='" + d + "_query' class='fm-button ui-state-default ui-corner-all fm-button-icon-left'><span class='ui-icon ui-icon-comment'></span>Query</a>"
                    }
                    if (!c.columns.length) {
                        b.each(e,
                        function(z, C) {
                            if (!C.label) {
                                C.label = u.p.colNames[z]
                            }
                            if (!p) {
                                var y = (C.search === undefined) ? true: C.search,
                                B = (C.hidden === true),
                                A = (C.searchoptions && C.searchoptions.searchhidden === true);
                                if ((A && y) || (y && !B)) {
                                    p = true;
                                    o = C.index || C.name;
                                    r = z
                                }
                            }
                        })
                    } else {
                        e = c.columns;
                        r = 0;
                        o = e[0].index || e[0].name
                    }
                    if ((!g && o) || c.multipleSearch === false) {
                        var m = "eq";
                        if (r >= 0 && e[r].searchoptions && e[r].searchoptions.sopt) {
                            m = e[r].searchoptions.sopt[0]
                        } else {
                            if (c.sopt && c.sopt.length) {
                                m = c.sopt[0]
                            }
                        }
                        g = {
                            groupOp: "AND",
                            rules: [{
                                field: o,
                                op: m,
                                data: ""
                            }]
                        }
                    }
                    p = false;
                    if (c.tmplNames && c.tmplNames.length) {
                        p = true;
                        k = c.tmplLabel;
                        k += "<select class='ui-template'>";
                        k += "<option value='default'>Default</option>";
                        b.each(c.tmplNames,
                        function(y, z) {
                            k += "<option value='" + y + "'>" + z + "</option>"
                        });
                        k += "</select>"
                    }
                    w = "<table class='EditTable' style='border:0px none;margin-top:5px' id='" + d + "_2'><tbody><tr><td colspan='2'><hr class='ui-widget-content' style='margin:1px'/></td></tr><tr><td class='EditButton' style='text-align:" + t + "'>" + x + k + "</td><td class='EditButton' " + j + ">" + s + q + "</td></tr></tbody></table>";
                    d = b.jgrid.jqID(d);
                    b("#" + d).jqFilter({
                        columns: e,
                        filter: c.loadDefaults ? g: null,
                        showQuery: c.showQuery,
                        errorcheck: c.errorcheck,
                        sopt: c.sopt,
                        groupButton: c.multipleGroup,
                        ruleButtons: c.multipleSearch,
                        afterRedraw: c.afterRedraw,
                        ops: c.odata,
                        operands: c.operands,
                        ajaxSelectOptions: u.p.ajaxSelectOptions,
                        groupOps: c.groupOps,
                        onChange: function() {
                            if (this.p.showQuery) {
                                b(".query", this).html(this.toUserFriendlyString())
                            }
                            if (b.isFunction(c.afterChange)) {
                                c.afterChange.call(u, b("#" + d), c)
                            }
                        },
                        direction: u.p.direction,
                        id: u.p.id
                    });
                    v.append(w);
                    if (p && c.tmplFilters && c.tmplFilters.length) {
                        b(".ui-template", v).bind("change",
                        function() {
                            var y = b(this).val();
                            if (y === "default") {
                                b("#" + d).jqFilter("addFilter", g)
                            } else {
                                b("#" + d).jqFilter("addFilter", c.tmplFilters[parseInt(y, 10)])
                            }
                            return false
                        })
                    }
                    if (c.multipleGroup === true) {
                        c.multipleSearch = true
                    }
                    b(u).triggerHandler("jqGridFilterInitialize", [b("#" + d)]);
                    if (b.isFunction(c.onInitializeSearch)) {
                        c.onInitializeSearch.call(u, b("#" + d))
                    }
                    c.gbox = "#gbox_" + d;
                    if (c.layer) {
                        b.jgrid.createModal(f, v, c, "#gview_" + b.jgrid.jqID(u.p.id), b("#gbox_" + b.jgrid.jqID(u.p.id))[0], "#" + b.jgrid.jqID(c.layer), {
                            position: "relative"
                        })
                    } else {
                        b.jgrid.createModal(f, v, c, "#gview_" + b.jgrid.jqID(u.p.id), b("#gbox_" + b.jgrid.jqID(u.p.id))[0])
                    }
                    if (c.searchOnEnter || c.closeOnEscape) {
                        b("#" + b.jgrid.jqID(f.themodal)).keydown(function(z) {
                            var y = b(z.target);
                            if (c.searchOnEnter && z.which === 13 && !y.hasClass("add-group") && !y.hasClass("add-rule") && !y.hasClass("delete-group") && !y.hasClass("delete-rule") && (!y.hasClass("fm-button") || !y.is("[id$=_query]"))) {
                                b("#" + d + "_search").click();
                                return false
                            }
                            if (c.closeOnEscape && z.which === 27) {
                                b("#" + b.jgrid.jqID(f.modalhead)).find(".ui-jqdialog-titlebar-close").click();
                                return false
                            }
                        })
                    }
                    if (s) {
                        b("#" + d + "_query").bind("click",
                        function() {
                            b(".queryresult", v).toggle();
                            return false
                        })
                    }
                    if (c.stringResult === undefined) {
                        c.stringResult = c.multipleSearch
                    }
                    b("#" + d + "_search").bind("click",
                    function() {
                        var z = {},
                        y, A;
                        l = b("#" + d);
                        l.find(".input-elm:focus").change();
                        A = l.jqFilter("filterData");
                        if (c.errorcheck) {
                            l[0].hideError();
                            if (!c.showQuery) {
                                l.jqFilter("toSQLString")
                            }
                            if (l[0].p.error) {
                                l[0].showError();
                                return false
                            }
                        }
                        if (c.stringResult) {
                            try {
                                y = xmlJsonClass.toJson(A, "", "", false)
                            } catch(C) {
                                try {
                                    y = JSON.stringify(A)
                                } catch(B) {}
                            }
                            if (typeof y === "string") {
                                z[c.sFilter] = y;
                                b.each([c.sField, c.sValue, c.sOper],
                                function() {
                                    z[this] = ""
                                })
                            }
                        } else {
                            if (c.multipleSearch) {
                                z[c.sFilter] = A;
                                b.each([c.sField, c.sValue, c.sOper],
                                function() {
                                    z[this] = ""
                                })
                            } else {
                                z[c.sField] = A.rules[0].field;
                                z[c.sValue] = A.rules[0].data;
                                z[c.sOper] = A.rules[0].op;
                                z[c.sFilter] = ""
                            }
                        }
                        u.p.search = true;
                        b.extend(u.p.postData, z);
                        n = b(u).triggerHandler("jqGridFilterSearch");
                        if (n === undefined) {
                            n = true
                        }
                        if (n && b.isFunction(c.onSearch)) {
                            n = c.onSearch.call(u, u.p.filters)
                        }
                        if (n !== false) {
                            b(u).trigger("reloadGrid", [{
                                page: 1
                            }])
                        }
                        if (c.closeAfterSearch) {
                            b.jgrid.hideModal("#" + b.jgrid.jqID(f.themodal), {
                                gb: "#gbox_" + b.jgrid.jqID(u.p.id),
                                jqm: c.jqModal,
                                onClose: c.onClose
                            })
                        }
                        return false
                    });
                    b("#" + d + "_reset").bind("click",
                    function() {
                        var y = {},
                        z = b("#" + d);
                        u.p.search = false;
                        u.p.resetsearch = true;
                        if (c.multipleSearch === false) {
                            y[c.sField] = y[c.sValue] = y[c.sOper] = ""
                        } else {
                            y[c.sFilter] = ""
                        }
                        z[0].resetFilter();
                        if (p) {
                            b(".ui-template", v).val("default")
                        }
                        b.extend(u.p.postData, y);
                        n = b(u).triggerHandler("jqGridFilterReset");
                        if (n === undefined) {
                            n = true
                        }
                        if (n && b.isFunction(c.onReset)) {
                            n = c.onReset.call(u)
                        }
                        if (n !== false) {
                            b(u).trigger("reloadGrid", [{
                                page: 1
                            }])
                        }
                        if (c.closeAfterReset) {
                            b.jgrid.hideModal("#" + b.jgrid.jqID(f.themodal), {
                                gb: "#gbox_" + b.jgrid.jqID(u.p.id),
                                jqm: c.jqModal,
                                onClose: c.onClose
                            })
                        }
                        return false
                    });
                    h(b("#" + d));
                    b(".fm-button:not(.ui-state-disabled)", v).hover(function() {
                        b(this).addClass("ui-state-hover")
                    },
                    function() {
                        b(this).removeClass("ui-state-hover")
                    })
                }
            })
        },
        editGridRow: function(c, d) {
            d = b.extend(true, {
                top: 0,
                left: 0,
                width: 300,
                datawidth: "auto",
                height: "auto",
                dataheight: "auto",
                modal: false,
                overlay: 30,
                drag: true,
                resize: true,
                url: null,
                mtype: "POST",
                clearAfterAdd: true,
                closeAfterEdit: false,
                reloadAfterSubmit: true,
                onInitializeForm: null,
                beforeInitData: null,
                beforeShowForm: null,
                afterShowForm: null,
                beforeSubmit: null,
                afterSubmit: null,
                onclickSubmit: null,
                afterComplete: null,
                onclickPgButtons: null,
                afterclickPgButtons: null,
                editData: {},
                recreateForm: false,
                jqModal: true,
                closeOnEscape: false,
                addedrow: "first",
                topinfo: "",
                bottominfo: "",
                saveicon: [],
                closeicon: [],
                savekey: [false, 13],
                navkeys: [false, 38, 40],
                checkOnSubmit: false,
                checkOnUpdate: false,
                _savedData: {},
                processing: false,
                onClose: null,
                ajaxEditOptions: {},
                serializeEditData: null,
                viewPagerButtons: true,
                overlayClass: "ui-widget-overlay",
                removemodal: true,
                form: "edit"
            },
            b.jgrid.edit, d || {});
            a[b(this)[0].p.id] = d;
            return this.each(function() {
                var e = this;
                if (!e.grid || !c) {
                    return
                }
                var B = e.p.id,
                y = "FrmGrid_" + B,
                S = "TblGrid_" + B,
                v = "#" + b.jgrid.jqID(S),
                j = {
                    themodal: "editmod" + B,
                    modalhead: "edithd" + B,
                    modalcontent: "editcnt" + B,
                    scrollelm: y
                },
                C = b.isFunction(a[e.p.id].beforeShowForm) ? a[e.p.id].beforeShowForm: false,
                K = b.isFunction(a[e.p.id].afterShowForm) ? a[e.p.id].afterShowForm: false,
                J = b.isFunction(a[e.p.id].beforeInitData) ? a[e.p.id].beforeInitData: false,
                p = b.isFunction(a[e.p.id].onInitializeForm) ? a[e.p.id].onInitializeForm: false,
                V = true,
                F = 1,
                r = 0,
                D,
                A,
                E;
                y = b.jgrid.jqID(y);
                if (c === "new") {
                    c = "_empty";
                    E = "add";
                    d.caption = a[e.p.id].addCaption
                } else {
                    d.caption = a[e.p.id].editCaption;
                    E = "edit"
                }
                if (!d.recreateForm) {
                    if (b(e).data("formProp")) {
                        b.extend(a[b(this)[0].p.id], b(e).data("formProp"))
                    }
                }
                var m = true;
                if (d.checkOnUpdate && d.jqModal && !d.modal) {
                    m = false
                }
                function U() {
                    b(v + " > tbody > tr > td .FormElement").each(function() {
                        var ab = b(".customelement", this);
                        if (ab.length) {
                            var Z = ab[0],
                            X = b(Z).attr("name");
                            b.each(e.p.colModel,
                            function() {
                                if (this.name === X && this.editoptions && b.isFunction(this.editoptions.custom_value)) {
                                    try {
                                        D[X] = this.editoptions.custom_value.call(e, b("#" + b.jgrid.jqID(X), v), "get");
                                        if (D[X] === undefined) {
                                            throw "e1"
                                        }
                                    } catch(ac) {
                                        if (ac === "e1") {
                                            b.jgrid.info_dialog(b.jgrid.errors.errcap, "function 'custom_value' " + b.jgrid.edit.msg.novalue, b.jgrid.edit.bClose)
                                        } else {
                                            b.jgrid.info_dialog(b.jgrid.errors.errcap, ac.message, b.jgrid.edit.bClose)
                                        }
                                    }
                                    return true
                                }
                            })
                        } else {
                            switch (b(this).get(0).type) {
                            case "checkbox":
                                if (b(this).is(":checked")) {
                                    D[this.name] = b(this).val()
                                } else {
                                    var Y = b(this).attr("offval");
                                    D[this.name] = Y
                                }
                                break;
                            case "select-one":
                                D[this.name] = b("option:selected", this).val();
                                break;
                            case "select-multiple":
                                D[this.name] = b(this).val();
                                if (D[this.name]) {
                                    D[this.name] = D[this.name].join(",")
                                } else {
                                    D[this.name] = ""
                                }
                                var aa = [];
                                b("option:selected", this).each(function(ac, ad) {
                                    aa[ac] = b(ad).text()
                                });
                                break;
                            case "password":
                            case "text":
                            case "textarea":
                            case "button":
                                D[this.name] = b(this).val();
                                break
                            }
                            if (e.p.autoencode) {
                                D[this.name] = b.jgrid.htmlEncode(D[this.name])
                            }
                        }
                    });
                    return true
                }
                function t(Z, ag, ad, ab) {
                    var an, ah, Y, ac = 0,
                    af, am, X, aj = [],
                    aa = false,
                    ai = "<td class='CaptionTD'>&#160;</td><td class='DataTD'>&#160;</td>",
                    al = "",
                    ae;
                    for (ae = 1; ae <= ab; ae++) {
                        al += ai
                    }
                    if (Z !== "_empty") {
                        aa = b(ag).jqGrid("getInd", Z)
                    }
                    b(ag.p.colModel).each(function(aq) {
                        an = this.name;
                        if (this.editrules && this.editrules.edithidden === true) {
                            ah = false
                        } else {
                            ah = this.hidden === true ? true: false
                        }
                        am = ah ? "style='display:none'": "";
                        if (an !== "cb" && an !== "subgrid" && this.editable === true && an !== "rn") {
                            if (aa === false) {
                                af = ""
                            } else {
                                if (an === ag.p.ExpandColumn && ag.p.treeGrid === true) {
                                    af = b("td[role='gridcell']:eq(" + aq + ")", ag.rows[aa]).text()
                                } else {
                                    try {
                                        af = b.unformat.call(ag, b("td[role='gridcell']:eq(" + aq + ")", ag.rows[aa]), {
                                            rowId: Z,
                                            colModel: this
                                        },
                                        aq)
                                    } catch(ao) {
                                        af = (this.edittype && this.edittype === "textarea") ? b("td[role='gridcell']:eq(" + aq + ")", ag.rows[aa]).text() : b("td[role='gridcell']:eq(" + aq + ")", ag.rows[aa]).html()
                                    }
                                    if (!af || af === "&nbsp;" || af === "&#160;" || (af.length === 1 && af.charCodeAt(0) === 160)) {
                                        af = ""
                                    }
                                }
                            }
                            var ap = b.extend({},
                            this.editoptions || {},
                            {
                                id: an,
                                name: an,
                                rowId: Z
                            }),
                            av = b.extend({},
                            {
                                elmprefix: "",
                                elmsuffix: "",
                                rowabove: false,
                                rowcontent: ""
                            },
                            this.formoptions || {}),
                            ar = parseInt(av.rowpos, 10) || ac + 1,
                            au = parseInt((parseInt(av.colpos, 10) || 1) * 2, 10);
                            if (Z === "_empty" && ap.defaultValue) {
                                af = b.isFunction(ap.defaultValue) ? ap.defaultValue.call(e) : ap.defaultValue
                            }
                            if (!this.edittype) {
                                this.edittype = "text"
                            }
                            if (e.p.autoencode) {
                                af = b.jgrid.htmlDecode(af)
                            }
                            X = b.jgrid.createEl.call(e, this.edittype, ap, af, false, b.extend({},
                            b.jgrid.ajaxOptions, ag.p.ajaxSelectOptions || {}));
                            if (a[e.p.id].checkOnSubmit || a[e.p.id].checkOnUpdate) {
                                a[e.p.id]._savedData[an] = af
                            }
                            b(X).addClass("FormElement");
                            if (b.inArray(this.edittype, ["text", "textarea", "password", "select"]) > -1) {
                                b(X).addClass("ui-widget-content ui-corner-all")
                            }
                            Y = b(ad).find("tr[rowpos=" + ar + "]");
                            if (av.rowabove) {
                                var at = b("<tr><td class='contentinfo' colspan='" + (ab * 2) + "'>" + av.rowcontent + "</td></tr>");
                                b(ad).append(at);
                                at[0].rp = ar
                            }
                            if (Y.length === 0) {
                                Y = b("<tr " + am + " rowpos='" + ar + "'></tr>").addClass("FormData").attr("id", "tr_" + an);
                                b(Y).append(al);
                                b(ad).append(Y);
                                Y[0].rp = ar
                            }
                            b("td:eq(" + (au - 2) + ")", Y[0]).html(av.label === undefined ? ag.p.colNames[aq] : av.label);
                            b("td:eq(" + (au - 1) + ")", Y[0]).append(av.elmprefix).append(X).append(av.elmsuffix);
                            if (this.edittype === "custom" && b.isFunction(ap.custom_value)) {
                                ap.custom_value.call(e, b("#" + an, "#" + y), "set", af)
                            }
                            b.jgrid.bindEv.call(e, X, ap);
                            aj[ac] = aq;
                            ac++
                        }
                    });
                    if (ac > 0) {
                        var ak = b("<tr class='FormData' style='display:none'><td class='CaptionTD'></td><td colspan='" + (ab * 2 - 1) + "' class='DataTD'><input class='FormElement' id='id_g' type='text' name='" + ag.p.id + "_id' value='" + Z + "'/></td></tr>");
                        ak[0].rp = ac + 999;
                        b(ad).append(ak);
                        if (a[e.p.id].checkOnSubmit || a[e.p.id].checkOnUpdate) {
                            a[e.p.id]._savedData[ag.p.id + "_id"] = Z
                        }
                    }
                    return aj
                }
                function q(X, ae, aa) {
                    var ai, ab = 0,
                    af, ad, Y, ac, ag;
                    if (a[e.p.id].checkOnSubmit || a[e.p.id].checkOnUpdate) {
                        a[e.p.id]._savedData = {};
                        a[e.p.id]._savedData[ae.p.id + "_id"] = X
                    }
                    var ah = ae.p.colModel;
                    if (X === "_empty") {
                        b(ah).each(function() {
                            ai = this.name;
                            Y = b.extend({},
                            this.editoptions || {});
                            ad = b("#" + b.jgrid.jqID(ai), "#" + aa);
                            if (ad && ad.length && ad[0] !== null) {
                                ac = "";
                                if (this.edittype === "custom" && b.isFunction(Y.custom_value)) {
                                    Y.custom_value.call(e, b("#" + ai, "#" + aa), "set", ac)
                                } else {
                                    if (Y.defaultValue) {
                                        ac = b.isFunction(Y.defaultValue) ? Y.defaultValue.call(e) : Y.defaultValue;
                                        if (ad[0].type === "checkbox") {
                                            ag = ac.toLowerCase();
                                            if (ag.search(/(false|f|0|no|n|off|undefined)/i) < 0 && ag !== "") {
                                                ad[0].checked = true;
                                                ad[0].defaultChecked = true;
                                                ad[0].value = ac
                                            } else {
                                                ad[0].checked = false;
                                                ad[0].defaultChecked = false
                                            }
                                        } else {
                                            ad.val(ac)
                                        }
                                    } else {
                                        if (ad[0].type === "checkbox") {
                                            ad[0].checked = false;
                                            ad[0].defaultChecked = false;
                                            ac = b(ad).attr("offval")
                                        } else {
                                            if (ad[0].type && ad[0].type.substr(0, 6) === "select") {
                                                ad[0].selectedIndex = 0
                                            } else {
                                                ad.val(ac)
                                            }
                                        }
                                    }
                                }
                                if (a[e.p.id].checkOnSubmit === true || a[e.p.id].checkOnUpdate) {
                                    a[e.p.id]._savedData[ai] = ac
                                }
                            }
                        });
                        b("#id_g", "#" + aa).val(X);
                        return
                    }
                    var Z = b(ae).jqGrid("getInd", X, true);
                    if (!Z) {
                        return
                    }
                    b('td[role="gridcell"]', Z).each(function(am) {
                        ai = ah[am].name;
                        if (ai !== "cb" && ai !== "subgrid" && ai !== "rn" && ah[am].editable === true) {
                            if (ai === ae.p.ExpandColumn && ae.p.treeGrid === true) {
                                af = b(this).text()
                            } else {
                                try {
                                    af = b.unformat.call(ae, b(this), {
                                        rowId: X,
                                        colModel: ah[am]
                                    },
                                    am)
                                } catch(al) {
                                    af = ah[am].edittype === "textarea" ? b(this).text() : b(this).html()
                                }
                            }
                            if (e.p.autoencode) {
                                af = b.jgrid.htmlDecode(af)
                            }
                            if (a[e.p.id].checkOnSubmit === true || a[e.p.id].checkOnUpdate) {
                                a[e.p.id]._savedData[ai] = af
                            }
                            ai = b.jgrid.jqID(ai);
                            switch (ah[am].edittype) {
                            case "password":
                            case "text":
                            case "button":
                            case "image":
                            case "textarea":
                                if (af === "&nbsp;" || af === "&#160;" || (af.length === 1 && af.charCodeAt(0) === 160)) {
                                    af = ""
                                }
                                b("#" + ai, "#" + aa).val(af);
                                break;
                            case "select":
                                var ak = af.split(",");
                                ak = b.map(ak,
                                function(ao) {
                                    return b.trim(ao)
                                });
                                b("#" + ai + " option", "#" + aa).each(function() {
                                    if (!ah[am].editoptions.multiple && (b.trim(af) === b.trim(b(this).text()) || ak[0] === b.trim(b(this).text()) || ak[0] === b.trim(b(this).val()))) {
                                        this.selected = true
                                    } else {
                                        if (ah[am].editoptions.multiple) {
                                            if (b.inArray(b.trim(b(this).text()), ak) > -1 || b.inArray(b.trim(b(this).val()), ak) > -1) {
                                                this.selected = true
                                            } else {
                                                this.selected = false
                                            }
                                        } else {
                                            this.selected = false
                                        }
                                    }
                                });
                                break;
                            case "checkbox":
                                af = String(af);
                                if (ah[am].editoptions && ah[am].editoptions.value) {
                                    var aj = ah[am].editoptions.value.split(":");
                                    if (aj[0] === af) {
                                        b("#" + ai, "#" + aa)[e.p.useProp ? "prop": "attr"]({
                                            checked: true,
                                            defaultChecked: true
                                        })
                                    } else {
                                        b("#" + ai, "#" + aa)[e.p.useProp ? "prop": "attr"]({
                                            checked: false,
                                            defaultChecked: false
                                        })
                                    }
                                } else {
                                    af = af.toLowerCase();
                                    if (af.search(/(false|f|0|no|n|off|undefined)/i) < 0 && af !== "") {
                                        b("#" + ai, "#" + aa)[e.p.useProp ? "prop": "attr"]("checked", true);
                                        b("#" + ai, "#" + aa)[e.p.useProp ? "prop": "attr"]("defaultChecked", true)
                                    } else {
                                        b("#" + ai, "#" + aa)[e.p.useProp ? "prop": "attr"]("checked", false);
                                        b("#" + ai, "#" + aa)[e.p.useProp ? "prop": "attr"]("defaultChecked", false)
                                    }
                                }
                                break;
                            case "custom":
                                try {
                                    if (ah[am].editoptions && b.isFunction(ah[am].editoptions.custom_value)) {
                                        ah[am].editoptions.custom_value.call(e, b("#" + ai, "#" + aa), "set", af)
                                    } else {
                                        throw "e1"
                                    }
                                } catch(an) {
                                    if (an === "e1") {
                                        b.jgrid.info_dialog(b.jgrid.errors.errcap, "function 'custom_value' " + b.jgrid.edit.msg.nodefined, b.jgrid.edit.bClose)
                                    } else {
                                        b.jgrid.info_dialog(b.jgrid.errors.errcap, an.message, b.jgrid.edit.bClose)
                                    }
                                }
                                break
                            }
                            ab++
                        }
                    });
                    if (ab > 0) {
                        b("#id_g", v).val(X)
                    }
                }
                function Q() {
                    b.each(e.p.colModel,
                    function(X, Y) {
                        if (Y.editoptions && Y.editoptions.NullIfEmpty === true) {
                            if (D.hasOwnProperty(Y.name) && D[Y.name] === "") {
                                D[Y.name] = "null"
                            }
                        }
                    })
                }
                function k() {
                    var ai, ah = [true, "", ""],
                    X = {},
                    ad = e.p.prmNames,
                    ag,
                    ab,
                    al,
                    ae,
                    ac,
                    Y;
                    var af = b(e).triggerHandler("jqGridAddEditBeforeCheckValues", [b("#" + y), E]);
                    if (af && typeof af === "object") {
                        D = af
                    }
                    if (b.isFunction(a[e.p.id].beforeCheckValues)) {
                        af = a[e.p.id].beforeCheckValues.call(e, D, b("#" + y), E);
                        if (af && typeof af === "object") {
                            D = af
                        }
                    }
                    for (al in D) {
                        if (D.hasOwnProperty(al)) {
                            ah = b.jgrid.checkValues.call(e, D[al], al);
                            if (ah[0] === false) {
                                break
                            }
                        }
                    }
                    Q();
                    if (ah[0]) {
                        X = b(e).triggerHandler("jqGridAddEditClickSubmit", [a[e.p.id], D, E]);
                        if (X === undefined && b.isFunction(a[e.p.id].onclickSubmit)) {
                            X = a[e.p.id].onclickSubmit.call(e, a[e.p.id], D, E) || {}
                        }
                        ah = b(e).triggerHandler("jqGridAddEditBeforeSubmit", [D, b("#" + y), E]);
                        if (ah === undefined) {
                            ah = [true, "", ""]
                        }
                        if (ah[0] && b.isFunction(a[e.p.id].beforeSubmit)) {
                            ah = a[e.p.id].beforeSubmit.call(e, D, b("#" + y), E)
                        }
                    }
                    if (ah[0] && !a[e.p.id].processing) {
                        a[e.p.id].processing = true;
                        b("#sData", v + "_2").addClass("ui-state-active");
                        Y = a[e.p.id].url || b(e).jqGrid("getGridParam", "editurl");
                        ab = ad.oper;
                        ag = Y === "clientArray" ? e.p.keyName: ad.id;
                        D[ab] = (b.trim(D[e.p.id + "_id"]) === "_empty") ? ad.addoper: ad.editoper;
                        if (D[ab] !== ad.addoper) {
                            D[ag] = D[e.p.id + "_id"]
                        } else {
                            if (D[ag] === undefined) {
                                D[ag] = D[e.p.id + "_id"]
                            }
                        }
                        delete D[e.p.id + "_id"];
                        D = b.extend(D, a[e.p.id].editData, X);
                        if (e.p.treeGrid === true) {
                            if (D[ab] === ad.addoper) {
                                ae = b(e).jqGrid("getGridParam", "selrow");
                                var Z = e.p.treeGridModel === "adjacency" ? e.p.treeReader.parent_id_field: "parent_id";
                                D[Z] = ae
                            }
                            for (ac in e.p.treeReader) {
                                if (e.p.treeReader.hasOwnProperty(ac)) {
                                    var ak = e.p.treeReader[ac];
                                    if (D.hasOwnProperty(ak)) {
                                        if (D[ab] === ad.addoper && ac === "parent_id_field") {
                                            continue
                                        }
                                        delete D[ak]
                                    }
                                }
                            }
                        }
                        D[ag] = b.jgrid.stripPref(e.p.idPrefix, D[ag]);
                        var aa = b.extend({
                            url: Y,
                            type: a[e.p.id].mtype,
                            data: b.isFunction(a[e.p.id].serializeEditData) ? a[e.p.id].serializeEditData.call(e, D) : D,
                            complete: function(ao, am) {
                                var an;
                                b("#sData", v + "_2").removeClass("ui-state-active");
                                D[ag] = e.p.idPrefix + D[ag];
                                if (ao.status >= 300 && ao.status !== 304) {
                                    ah[0] = false;
                                    ah[1] = b(e).triggerHandler("jqGridAddEditErrorTextFormat", [ao, E]);
                                    if (b.isFunction(a[e.p.id].errorTextFormat)) {
                                        ah[1] = a[e.p.id].errorTextFormat.call(e, ao, E)
                                    } else {
                                        ah[1] = am + " Status: '" + ao.statusText + "'. Error code: " + ao.status
                                    }
                                } else {
                                    ah = b(e).triggerHandler("jqGridAddEditAfterSubmit", [ao, D, E]);
                                    if (ah === undefined) {
                                        ah = [true, "", ""]
                                    }
                                    if (ah[0] && b.isFunction(a[e.p.id].afterSubmit)) {
                                        ah = a[e.p.id].afterSubmit.call(e, ao, D, E)
                                    }
                                }
                                if (ah[0] === false) {
                                    b("#FormError>td", v).html(ah[1]);
                                    b("#FormError", v).show()
                                } else {
                                    if (e.p.autoencode) {
                                        b.each(D,
                                        function(ar, aq) {
                                            D[ar] = b.jgrid.htmlDecode(aq)
                                        })
                                    }
                                    if (D[ab] === ad.addoper) {
                                        if (!ah[2]) {
                                            ah[2] = b.jgrid.randId()
                                        }
                                        if (D[ag] == null || D[ag] === "_empty") {
                                            D[ag] = ah[2]
                                        } else {
                                            ah[2] = D[ag]
                                        }
                                        if (a[e.p.id].reloadAfterSubmit) {
                                            b(e).trigger("reloadGrid")
                                        } else {
                                            if (e.p.treeGrid === true) {
                                                b(e).jqGrid("addChildNode", ah[2], ae, D)
                                            } else {
                                                b(e).jqGrid("addRowData", ah[2], D, d.addedrow)
                                            }
                                        }
                                        if (a[e.p.id].closeAfterAdd) {
                                            if (e.p.treeGrid !== true) {
                                                b(e).jqGrid("setSelection", ah[2])
                                            }
                                            b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                                                gb: "#gbox_" + b.jgrid.jqID(B),
                                                jqm: d.jqModal,
                                                onClose: a[e.p.id].onClose,
                                                removemodal: a[e.p.id].removemodal,
                                                formprop: !a[e.p.id].recreateForm,
                                                form: a[e.p.id].form
                                            })
                                        } else {
                                            if (a[e.p.id].clearAfterAdd) {
                                                q("_empty", e, y)
                                            }
                                        }
                                    } else {
                                        if (a[e.p.id].reloadAfterSubmit) {
                                            b(e).trigger("reloadGrid");
                                            if (!a[e.p.id].closeAfterEdit) {
                                                setTimeout(function() {
                                                    b(e).jqGrid("setSelection", D[ag])
                                                },
                                                1000)
                                            }
                                        } else {
                                            if (e.p.treeGrid === true) {
                                                b(e).jqGrid("setTreeRow", D[ag], D)
                                            } else {
                                                b(e).jqGrid("setRowData", D[ag], D)
                                            }
                                        }
                                        if (a[e.p.id].closeAfterEdit) {
                                            b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                                                gb: "#gbox_" + b.jgrid.jqID(B),
                                                jqm: d.jqModal,
                                                onClose: a[e.p.id].onClose,
                                                removemodal: a[e.p.id].removemodal,
                                                formprop: !a[e.p.id].recreateForm,
                                                form: a[e.p.id].form
                                            })
                                        }
                                    }
                                    if (b.isFunction(a[e.p.id].afterComplete)) {
                                        ai = ao;
                                        setTimeout(function() {
                                            b(e).triggerHandler("jqGridAddEditAfterComplete", [ai, D, b("#" + y), E]);
                                            a[e.p.id].afterComplete.call(e, ai, D, b("#" + y), E);
                                            ai = null
                                        },
                                        500)
                                    }
                                    if (a[e.p.id].checkOnSubmit || a[e.p.id].checkOnUpdate) {
                                        b("#" + y).data("disabled", false);
                                        if (a[e.p.id]._savedData[e.p.id + "_id"] !== "_empty") {
                                            for (an in a[e.p.id]._savedData) {
                                                if (a[e.p.id]._savedData.hasOwnProperty(an) && D[an]) {
                                                    a[e.p.id]._savedData[an] = D[an]
                                                }
                                            }
                                        }
                                    }
                                }
                                a[e.p.id].processing = false;
                                try {
                                    b(":input:visible", "#" + y)[0].focus()
                                } catch(ap) {}
                            }
                        },
                        b.jgrid.ajaxOptions, a[e.p.id].ajaxEditOptions);
                        if (!aa.url && !a[e.p.id].useDataProxy) {
                            if (b.isFunction(e.p.dataProxy)) {
                                a[e.p.id].useDataProxy = true
                            } else {
                                ah[0] = false;
                                ah[1] += " " + b.jgrid.errors.nourl
                            }
                        }
                        if (ah[0]) {
                            if (a[e.p.id].useDataProxy) {
                                var aj = e.p.dataProxy.call(e, aa, "set_" + e.p.id);
                                if (aj === undefined) {
                                    aj = [true, ""]
                                }
                                if (aj[0] === false) {
                                    ah[0] = false;
                                    ah[1] = aj[1] || "Error deleting the selected row!"
                                } else {
                                    if (aa.data.oper === ad.addoper && a[e.p.id].closeAfterAdd) {
                                        b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                                            gb: "#gbox_" + b.jgrid.jqID(B),
                                            jqm: d.jqModal,
                                            onClose: a[e.p.id].onClose,
                                            removemodal: a[e.p.id].removemodal,
                                            formprop: !a[e.p.id].recreateForm,
                                            form: a[e.p.id].form
                                        })
                                    }
                                    if (aa.data.oper === ad.editoper && a[e.p.id].closeAfterEdit) {
                                        b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                                            gb: "#gbox_" + b.jgrid.jqID(B),
                                            jqm: d.jqModal,
                                            onClose: a[e.p.id].onClose,
                                            removemodal: a[e.p.id].removemodal,
                                            formprop: !a[e.p.id].recreateForm,
                                            form: a[e.p.id].form
                                        })
                                    }
                                }
                            } else {
                                if (aa.url === "clientArray") {
                                    a[e.p.id].reloadAfterSubmit = false;
                                    D = aa.data;
                                    aa.complete({
                                        status: 200,
                                        statusText: ""
                                    },
                                    "")
                                } else {
                                    b.ajax(aa)
                                }
                            }
                        }
                    }
                    if (ah[0] === false) {
                        b("#FormError>td", v).html(ah[1]);
                        b("#FormError", v).show()
                    }
                }
                function H(aa, X) {
                    var Y = false,
                    Z;
                    for (Z in aa) {
                        if (aa.hasOwnProperty(Z) && aa[Z] != X[Z]) {
                            Y = true;
                            break
                        }
                    }
                    return Y
                }
                function h() {
                    var X = true;
                    b("#FormError", v).hide();
                    if (a[e.p.id].checkOnUpdate) {
                        D = {};
                        U();
                        A = H(D, a[e.p.id]._savedData);
                        if (A) {
                            b("#" + y).data("disabled", true);
                            b(".confirm", "#" + j.themodal).show();
                            X = false
                        }
                    }
                    return X
                }
                function T() {
                    var X;
                    if (c !== "_empty" && e.p.savedRow !== undefined && e.p.savedRow.length > 0 && b.isFunction(b.fn.jqGrid.restoreRow)) {
                        for (X = 0; X < e.p.savedRow.length; X++) {
                            if (e.p.savedRow[X].id == c) {
                                b(e).jqGrid("restoreRow", c);
                                break
                            }
                        }
                    }
                }
                function G(Y, X) {
                    var Z = X[1].length - 1;
                    if (Y === 0) {
                        b("#pData", v + "_2").addClass("ui-state-disabled")
                    } else {
                        if (X[1][Y - 1] !== undefined && b("#" + b.jgrid.jqID(X[1][Y - 1])).hasClass("ui-state-disabled")) {
                            b("#pData", v + "_2").addClass("ui-state-disabled")
                        } else {
                            b("#pData", v + "_2").removeClass("ui-state-disabled")
                        }
                    }
                    if (Y === Z) {
                        b("#nData", v + "_2").addClass("ui-state-disabled")
                    } else {
                        if (X[1][Y + 1] !== undefined && b("#" + b.jgrid.jqID(X[1][Y + 1])).hasClass("ui-state-disabled")) {
                            b("#nData", v + "_2").addClass("ui-state-disabled")
                        } else {
                            b("#nData", v + "_2").removeClass("ui-state-disabled")
                        }
                    }
                }
                function W() {
                    var Y = b(e).jqGrid("getDataIDs"),
                    X = b("#id_g", v).val(),
                    Z = b.inArray(X, Y);
                    return [Z, Y]
                }
                var s = isNaN(a[b(this)[0].p.id].dataheight) ? a[b(this)[0].p.id].dataheight: a[b(this)[0].p.id].dataheight + "px",
                g = isNaN(a[b(this)[0].p.id].datawidth) ? a[b(this)[0].p.id].datawidth: a[b(this)[0].p.id].datawidth + "px",
                P = b("<form name='FormPost' id='" + y + "' class='FormGrid' onSubmit='return false;' style='width:" + g + ";overflow:auto;position:relative;height:" + s + ";'></form>").data("disabled", false),
                z = b("<table id='" + S + "' class='EditTable' cellspacing='0' cellpadding='0' border='0'><tbody></tbody></table>");
                b(e.p.colModel).each(function() {
                    var X = this.formoptions;
                    F = Math.max(F, X ? X.colpos || 0 : 0);
                    r = Math.max(r, X ? X.rowpos || 0 : 0)
                });
                b(P).append(z);
                var I = b("<tr id='FormError' style='display:none'><td class='ui-state-error' colspan='" + (F * 2) + "'></td></tr>");
                I[0].rp = 0;
                b(z).append(I);
                I = b("<tr style='display:none' class='tinfo'><td class='topinfo' colspan='" + (F * 2) + "'>" + a[e.p.id].topinfo + "</td></tr>");
                I[0].rp = 0;
                b(z).append(I);
                V = b(e).triggerHandler("jqGridAddEditBeforeInitData", [P, E]);
                if (V === undefined) {
                    V = true
                }
                if (V && J) {
                    V = J.call(e, P, E)
                }
                if (V === false) {
                    return
                }
                T();
                var f = e.p.direction === "rtl" ? true: false,
                O = f ? "nData": "pData",
                R = f ? "pData": "nData";
                t(c, e, z, F);
                var l = "<a id='" + O + "' class='fm-button ui-state-default ui-corner-left'><span class='ui-icon ui-icon-triangle-1-w'></span></a>",
                n = "<a id='" + R + "' class='fm-button ui-state-default ui-corner-right'><span class='ui-icon ui-icon-triangle-1-e'></span></a>",
                i = "<a id='sData' class='fm-button ui-state-default ui-corner-all'>" + d.bSubmit + "</a>",
                u = "<a id='cData' class='fm-button ui-state-default ui-corner-all'>" + d.bCancel + "</a>";
                var M = "<table border='0' cellspacing='0' cellpadding='0' class='EditTable' id='" + S + "_2'><tbody><tr><td colspan='2'><hr class='ui-widget-content' style='margin:1px'/></td></tr><tr id='Act_Buttons'><td class='navButton'>" + (f ? n + l: l + n) + "</td><td class='EditButton'>" + i + u + "</td></tr>";
                M += "<tr style='display:none' class='binfo'><td class='bottominfo' colspan='2'>" + a[e.p.id].bottominfo + "</td></tr>";
                M += "</tbody></table>";
                if (r > 0) {
                    var x = [];
                    b.each(b(z)[0].rows,
                    function(X, Y) {
                        x[X] = Y
                    });
                    x.sort(function(Y, X) {
                        if (Y.rp > X.rp) {
                            return 1
                        }
                        if (Y.rp < X.rp) {
                            return - 1
                        }
                        return 0
                    });
                    b.each(x,
                    function(X, Y) {
                        b("tbody", z).append(Y)
                    })
                }
                d.gbox = "#gbox_" + b.jgrid.jqID(B);
                var o = false;
                if (d.closeOnEscape === true) {
                    d.closeOnEscape = false;
                    o = true
                }
                var L = b("<div></div>").append(P).append(M);
                b.jgrid.createModal(j, L, a[b(this)[0].p.id], "#gview_" + b.jgrid.jqID(e.p.id), b("#gbox_" + b.jgrid.jqID(e.p.id))[0]);
                if (f) {
                    b("#pData, #nData", v + "_2").css("float", "right");
                    b(".EditButton", v + "_2").css("text-align", "left")
                }
                if (a[e.p.id].topinfo) {
                    b(".tinfo", v).show()
                }
                if (a[e.p.id].bottominfo) {
                    b(".binfo", v + "_2").show()
                }
                L = null;
                M = null;
                b("#" + b.jgrid.jqID(j.themodal)).keydown(function(X) {
                    var Y = X.target;
                    if (b("#" + y).data("disabled") === true) {
                        return false
                    }
                    if (a[e.p.id].savekey[0] === true && X.which === a[e.p.id].savekey[1]) {
                        if (Y.tagName !== "TEXTAREA") {
                            b("#sData", v + "_2").trigger("click");
                            return false
                        }
                    }
                    if (X.which === 27) {
                        if (!h()) {
                            return false
                        }
                        if (o) {
                            b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                                gb: d.gbox,
                                jqm: d.jqModal,
                                onClose: a[e.p.id].onClose,
                                removemodal: a[e.p.id].removemodal,
                                formprop: !a[e.p.id].recreateForm,
                                form: a[e.p.id].form
                            })
                        }
                        return false
                    }
                    if (a[e.p.id].navkeys[0] === true) {
                        if (b("#id_g", v).val() === "_empty") {
                            return true
                        }
                        if (X.which === a[e.p.id].navkeys[1]) {
                            b("#pData", v + "_2").trigger("click");
                            return false
                        }
                        if (X.which === a[e.p.id].navkeys[2]) {
                            b("#nData", v + "_2").trigger("click");
                            return false
                        }
                    }
                });
                if (d.checkOnUpdate) {
                    b("a.ui-jqdialog-titlebar-close span", "#" + b.jgrid.jqID(j.themodal)).removeClass("jqmClose");
                    b("a.ui-jqdialog-titlebar-close", "#" + b.jgrid.jqID(j.themodal)).unbind("click").click(function() {
                        if (!h()) {
                            return false
                        }
                        b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                            gb: "#gbox_" + b.jgrid.jqID(B),
                            jqm: d.jqModal,
                            onClose: a[e.p.id].onClose,
                            removemodal: a[e.p.id].removemodal,
                            formprop: !a[e.p.id].recreateForm,
                            form: a[e.p.id].form
                        });
                        return false
                    })
                }
                d.saveicon = b.extend([true, "left", "ui-icon-disk"], d.saveicon);
                d.closeicon = b.extend([true, "left", "ui-icon-close"], d.closeicon);
                if (d.saveicon[0] === true) {
                    b("#sData", v + "_2").addClass(d.saveicon[1] === "right" ? "fm-button-icon-right": "fm-button-icon-left").append("<span class='ui-icon " + d.saveicon[2] + "'></span>")
                }
                if (d.closeicon[0] === true) {
                    b("#cData", v + "_2").addClass(d.closeicon[1] === "right" ? "fm-button-icon-right": "fm-button-icon-left").append("<span class='ui-icon " + d.closeicon[2] + "'></span>")
                }
                if (a[e.p.id].checkOnSubmit || a[e.p.id].checkOnUpdate) {
                    i = "<a id='sNew' class='fm-button ui-state-default ui-corner-all' style='z-index:1002'>" + d.bYes + "</a>";
                    n = "<a id='nNew' class='fm-button ui-state-default ui-corner-all' style='z-index:1002'>" + d.bNo + "</a>";
                    u = "<a id='cNew' class='fm-button ui-state-default ui-corner-all' style='z-index:1002'>" + d.bExit + "</a>";
                    var w = d.zIndex || 999;
                    w++;
                    b("<div class='" + d.overlayClass + " jqgrid-overlay confirm' style='z-index:" + w + ";display:none;'>&#160;</div><div class='confirm ui-widget-content ui-jqconfirm' style='z-index:" + (w + 1) + "'>" + d.saveData + "<br/><br/>" + i + n + u + "</div>").insertAfter("#" + y);
                    b("#sNew", "#" + b.jgrid.jqID(j.themodal)).click(function() {
                        k();
                        b("#" + y).data("disabled", false);
                        b(".confirm", "#" + b.jgrid.jqID(j.themodal)).hide();
                        return false
                    });
                    b("#nNew", "#" + b.jgrid.jqID(j.themodal)).click(function() {
                        b(".confirm", "#" + b.jgrid.jqID(j.themodal)).hide();
                        b("#" + y).data("disabled", false);
                        setTimeout(function() {
                            b(":input:visible", "#" + y)[0].focus()
                        },
                        0);
                        return false
                    });
                    b("#cNew", "#" + b.jgrid.jqID(j.themodal)).click(function() {
                        b(".confirm", "#" + b.jgrid.jqID(j.themodal)).hide();
                        b("#" + y).data("disabled", false);
                        b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                            gb: "#gbox_" + b.jgrid.jqID(B),
                            jqm: d.jqModal,
                            onClose: a[e.p.id].onClose,
                            removemodal: a[e.p.id].removemodal,
                            formprop: !a[e.p.id].recreateForm,
                            form: a[e.p.id].form
                        });
                        return false
                    })
                }
                b(e).triggerHandler("jqGridAddEditInitializeForm", [b("#" + y), E]);
                if (p) {
                    p.call(e, b("#" + y), E)
                }
                if (c === "_empty" || !a[e.p.id].viewPagerButtons) {
                    b("#pData,#nData", v + "_2").hide()
                } else {
                    b("#pData,#nData", v + "_2").show()
                }
                b(e).triggerHandler("jqGridAddEditBeforeShowForm", [b("#" + y), E]);
                if (C) {
                    C.call(e, b("#" + y), E)
                }
                b("#" + b.jgrid.jqID(j.themodal)).data("onClose", a[e.p.id].onClose);
                b.jgrid.viewModal("#" + b.jgrid.jqID(j.themodal), {
                    gbox: "#gbox_" + b.jgrid.jqID(B),
                    jqm: d.jqModal,
                    overlay: d.overlay,
                    modal: d.modal,
                    overlayClass: d.overlayClass,
                    onHide: function(Y) {
                        var X = b("#editmod" + B)[0].style.height;
                        if (X.indexOf("px") > -1) {
                            X = parseFloat(X)
                        }
                        b(e).data("formProp", {
                            top: parseFloat(b(Y.w).css("top")),
                            left: parseFloat(b(Y.w).css("left")),
                            width: b(Y.w).width(),
                            height: X,
                            dataheight: b("#" + y).height(),
                            datawidth: b("#" + y).width()
                        });
                        Y.w.remove();
                        if (Y.o) {
                            Y.o.remove()
                        }
                    }
                });
                if (!m) {
                    b("." + b.jgrid.jqID(d.overlayClass)).click(function() {
                        if (!h()) {
                            return false
                        }
                        b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                            gb: "#gbox_" + b.jgrid.jqID(B),
                            jqm: d.jqModal,
                            onClose: a[e.p.id].onClose,
                            removemodal: a[e.p.id].removemodal,
                            formprop: !a[e.p.id].recreateForm,
                            form: a[e.p.id].form
                        });
                        return false
                    })
                }
                b(".fm-button", "#" + b.jgrid.jqID(j.themodal)).hover(function() {
                    b(this).addClass("ui-state-hover")
                },
                function() {
                    b(this).removeClass("ui-state-hover")
                });
                b("#sData", v + "_2").click(function() {
                    D = {};
                    b("#FormError", v).hide();
                    U();
                    if (D[e.p.id + "_id"] === "_empty") {
                        k()
                    } else {
                        if (d.checkOnSubmit === true) {
                            A = H(D, a[e.p.id]._savedData);
                            if (A) {
                                b("#" + y).data("disabled", true);
                                b(".confirm", "#" + b.jgrid.jqID(j.themodal)).show()
                            } else {
                                k()
                            }
                        } else {
                            k()
                        }
                    }
                    return false
                });
                b("#cData", v + "_2").click(function() {
                    if (!h()) {
                        return false
                    }
                    b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                        gb: "#gbox_" + b.jgrid.jqID(B),
                        jqm: d.jqModal,
                        onClose: a[e.p.id].onClose,
                        removemodal: a[e.p.id].removemodal,
                        formprop: !a[e.p.id].recreateForm,
                        form: a[e.p.id].form
                    });
                    return false
                });
                b("#nData", v + "_2").click(function() {
                    if (!h()) {
                        return false
                    }
                    b("#FormError", v).hide();
                    var Y = W();
                    Y[0] = parseInt(Y[0], 10);
                    if (Y[0] !== -1 && Y[1][Y[0] + 1]) {
                        b(e).triggerHandler("jqGridAddEditClickPgButtons", ["next", b("#" + y), Y[1][Y[0]]]);
                        var X;
                        if (b.isFunction(d.onclickPgButtons)) {
                            X = d.onclickPgButtons.call(e, "next", b("#" + y), Y[1][Y[0]]);
                            if (X !== undefined && X === false) {
                                return false
                            }
                        }
                        if (b("#" + b.jgrid.jqID(Y[1][Y[0] + 1])).hasClass("ui-state-disabled")) {
                            return false
                        }
                        q(Y[1][Y[0] + 1], e, y);
                        b(e).jqGrid("setSelection", Y[1][Y[0] + 1]);
                        b(e).triggerHandler("jqGridAddEditAfterClickPgButtons", ["next", b("#" + y), Y[1][Y[0]]]);
                        if (b.isFunction(d.afterclickPgButtons)) {
                            d.afterclickPgButtons.call(e, "next", b("#" + y), Y[1][Y[0] + 1])
                        }
                        G(Y[0] + 1, Y)
                    }
                    return false
                });
                b("#pData", v + "_2").click(function() {
                    if (!h()) {
                        return false
                    }
                    b("#FormError", v).hide();
                    var Y = W();
                    if (Y[0] !== -1 && Y[1][Y[0] - 1]) {
                        b(e).triggerHandler("jqGridAddEditClickPgButtons", ["prev", b("#" + y), Y[1][Y[0]]]);
                        var X;
                        if (b.isFunction(d.onclickPgButtons)) {
                            X = d.onclickPgButtons.call(e, "prev", b("#" + y), Y[1][Y[0]]);
                            if (X !== undefined && X === false) {
                                return false
                            }
                        }
                        if (b("#" + b.jgrid.jqID(Y[1][Y[0] - 1])).hasClass("ui-state-disabled")) {
                            return false
                        }
                        q(Y[1][Y[0] - 1], e, y);
                        b(e).jqGrid("setSelection", Y[1][Y[0] - 1]);
                        b(e).triggerHandler("jqGridAddEditAfterClickPgButtons", ["prev", b("#" + y), Y[1][Y[0]]]);
                        if (b.isFunction(d.afterclickPgButtons)) {
                            d.afterclickPgButtons.call(e, "prev", b("#" + y), Y[1][Y[0] - 1])
                        }
                        G(Y[0] - 1, Y)
                    }
                    return false
                });
                b(e).triggerHandler("jqGridAddEditAfterShowForm", [b("#" + y), E]);
                if (K) {
                    K.call(e, b("#" + y), E)
                }
                var N = W();
                G(N[0], N)
            })
        },
        viewGridRow: function(c, d) {
            d = b.extend(true, {
                top: 0,
                left: 0,
                width: 0,
                datawidth: "auto",
                height: "auto",
                dataheight: "auto",
                modal: false,
                overlay: 30,
                drag: true,
                resize: true,
                jqModal: true,
                closeOnEscape: false,
                labelswidth: "30%",
                closeicon: [],
                navkeys: [false, 38, 40],
                onClose: null,
                beforeShowForm: null,
                beforeInitData: null,
                viewPagerButtons: true,
                recreateForm: false,
                removemodal: true,
                form: "view"
            },
            b.jgrid.view, d || {});
            a[b(this)[0].p.id] = d;
            return this.each(function() {
                var y = this;
                if (!y.grid || !c) {
                    return
                }
                var s = y.p.id,
                C = "ViewGrid_" + b.jgrid.jqID(s),
                u = "ViewTbl_" + b.jgrid.jqID(s),
                v = "ViewGrid_" + s,
                o = "ViewTbl_" + s,
                j = {
                    themodal: "viewmod" + s,
                    modalhead: "viewhd" + s,
                    modalcontent: "viewcnt" + s,
                    scrollelm: C
                },
                B = b.isFunction(a[y.p.id].beforeInitData) ? a[y.p.id].beforeInitData: false,
                m = true,
                h = 1,
                g = 0;
                if (!d.recreateForm) {
                    if (b(y).data("viewProp")) {
                        b.extend(a[b(this)[0].p.id], b(y).data("viewProp"))
                    }
                }
                function k() {
                    if (a[y.p.id].closeOnEscape === true || a[y.p.id].navkeys[0] === true) {
                        setTimeout(function() {
                            b(".ui-jqdialog-titlebar-close", "#" + b.jgrid.jqID(j.modalhead)).attr("tabindex", "-1").focus()
                        },
                        0)
                    }
                }
                function p(M, S, Q, Y) {
                    var I, L, T, W = 0,
                    ab, ac, aa = [],
                    R = false,
                    X,
                    N = "<td class='CaptionTD form-view-label ui-widget-content' width='" + d.labelswidth + "'>&#160;</td><td class='DataTD form-view-data ui-helper-reset ui-widget-content'>&#160;</td>",
                    P = "",
                    J = "<td class='CaptionTD form-view-label ui-widget-content'>&#160;</td><td class='DataTD form-view-data ui-widget-content'>&#160;</td>",
                    O = ["integer", "number", "currency"],
                    V = 0,
                    U = 0,
                    K,
                    H,
                    Z;
                    for (X = 1; X <= Y; X++) {
                        P += X === 1 ? N: J
                    }
                    b(S.p.colModel).each(function() {
                        if (this.editrules && this.editrules.edithidden === true) {
                            L = false
                        } else {
                            L = this.hidden === true ? true: false
                        }
                        if (!L && this.align === "right") {
                            if (this.formatter && b.inArray(this.formatter, O) !== -1) {
                                V = Math.max(V, parseInt(this.width, 10))
                            } else {
                                U = Math.max(U, parseInt(this.width, 10))
                            }
                        }
                    });
                    K = V !== 0 ? V: U !== 0 ? U: 0;
                    R = b(S).jqGrid("getInd", M);
                    b(S.p.colModel).each(function(ae) {
                        I = this.name;
                        H = false;
                        if (this.editrules && this.editrules.edithidden === true) {
                            L = false
                        } else {
                            L = this.hidden === true ? true: false
                        }
                        ac = L ? "style='display:none'": "";
                        Z = (typeof this.viewable !== "boolean") ? true: this.viewable;
                        if (I !== "cb" && I !== "subgrid" && I !== "rn" && Z) {
                            if (R === false) {
                                ab = ""
                            } else {
                                if (I === S.p.ExpandColumn && S.p.treeGrid === true) {
                                    ab = b("td:eq(" + ae + ")", S.rows[R]).text()
                                } else {
                                    ab = b("td:eq(" + ae + ")", S.rows[R]).html()
                                }
                            }
                            H = this.align === "right" && K !== 0 ? true: false;
                            var ai = b.extend({},
                            {
                                rowabove: false,
                                rowcontent: ""
                            },
                            this.formoptions || {}),
                            af = parseInt(ai.rowpos, 10) || W + 1,
                            ah = parseInt((parseInt(ai.colpos, 10) || 1) * 2, 10);
                            if (ai.rowabove) {
                                var ag = b("<tr><td class='contentinfo' colspan='" + (Y * 2) + "'>" + ai.rowcontent + "</td></tr>");
                                b(Q).append(ag);
                                ag[0].rp = af
                            }
                            T = b(Q).find("tr[rowpos=" + af + "]");
                            if (T.length === 0) {
                                T = b("<tr " + ac + " rowpos='" + af + "'></tr>").addClass("FormData").attr("id", "trv_" + I);
                                b(T).append(P);
                                b(Q).append(T);
                                T[0].rp = af
                            }
                            b("td:eq(" + (ah - 2) + ")", T[0]).html("<b>" + (ai.label === undefined ? S.p.colNames[ae] : ai.label) + "</b>");
                            b("td:eq(" + (ah - 1) + ")", T[0]).append("<span>" + ab + "</span>").attr("id", "v_" + I);
                            if (H) {
                                b("td:eq(" + (ah - 1) + ") span", T[0]).css({
                                    "text-align": "right",
                                    width: K + "px"
                                })
                            }
                            aa[W] = ae;
                            W++
                        }
                    });
                    if (W > 0) {
                        var ad = b("<tr class='FormData' style='display:none'><td class='CaptionTD'></td><td colspan='" + (Y * 2 - 1) + "' class='DataTD'><input class='FormElement' id='id_g' type='text' name='id' value='" + M + "'/></td></tr>");
                        ad[0].rp = W + 99;
                        b(Q).append(ad)
                    }
                    return aa
                }
                function n(K, M) {
                    var H, N, J = 0,
                    I, L;
                    L = b(M).jqGrid("getInd", K, true);
                    if (!L) {
                        return
                    }
                    b("td", L).each(function(O) {
                        H = M.p.colModel[O].name;
                        if (M.p.colModel[O].editrules && M.p.colModel[O].editrules.edithidden === true) {
                            N = false
                        } else {
                            N = M.p.colModel[O].hidden === true ? true: false
                        }
                        if (H !== "cb" && H !== "subgrid" && H !== "rn") {
                            if (H === M.p.ExpandColumn && M.p.treeGrid === true) {
                                I = b(this).text()
                            } else {
                                I = b(this).html()
                            }
                            H = b.jgrid.jqID("v_" + H);
                            b("#" + H + " span", "#" + u).html(I);
                            if (N) {
                                b("#" + H, "#" + u).parents("tr:first").hide()
                            }
                            J++
                        }
                    });
                    if (J > 0) {
                        b("#id_g", "#" + u).val(K)
                    }
                }
                function q(I, H) {
                    var J = H[1].length - 1;
                    if (I === 0) {
                        b("#pData", "#" + u + "_2").addClass("ui-state-disabled")
                    } else {
                        if (H[1][I - 1] !== undefined && b("#" + b.jgrid.jqID(H[1][I - 1])).hasClass("ui-state-disabled")) {
                            b("#pData", u + "_2").addClass("ui-state-disabled")
                        } else {
                            b("#pData", "#" + u + "_2").removeClass("ui-state-disabled")
                        }
                    }
                    if (I === J) {
                        b("#nData", "#" + u + "_2").addClass("ui-state-disabled")
                    } else {
                        if (H[1][I + 1] !== undefined && b("#" + b.jgrid.jqID(H[1][I + 1])).hasClass("ui-state-disabled")) {
                            b("#nData", u + "_2").addClass("ui-state-disabled")
                        } else {
                            b("#nData", "#" + u + "_2").removeClass("ui-state-disabled")
                        }
                    }
                }
                function i() {
                    var I = b(y).jqGrid("getDataIDs"),
                    H = b("#id_g", "#" + u).val(),
                    J = b.inArray(H, I);
                    return [J, I]
                }
                var A = isNaN(a[b(this)[0].p.id].dataheight) ? a[b(this)[0].p.id].dataheight: a[b(this)[0].p.id].dataheight + "px",
                t = isNaN(a[b(this)[0].p.id].datawidth) ? a[b(this)[0].p.id].datawidth: a[b(this)[0].p.id].datawidth + "px",
                E = b("<form name='FormPost' id='" + v + "' class='FormGrid' style='width:" + t + ";overflow:auto;position:relative;height:" + A + ";'></form>"),
                l = b("<table id='" + o + "' class='EditTable' cellspacing='1' cellpadding='2' border='0' style='table-layout:fixed'><tbody></tbody></table>");
                b(y.p.colModel).each(function() {
                    var H = this.formoptions;
                    h = Math.max(h, H ? H.colpos || 0 : 0);
                    g = Math.max(g, H ? H.rowpos || 0 : 0)
                });
                b(E).append(l);
                if (B) {
                    m = B.call(y, E);
                    if (m === undefined) {
                        m = true
                    }
                }
                if (m === false) {
                    return
                }
                p(c, y, l, h);
                var z = y.p.direction === "rtl" ? true: false,
                G = z ? "nData": "pData",
                f = z ? "pData": "nData",
                w = "<a id='" + G + "' class='fm-button ui-state-default ui-corner-left'><span class='ui-icon ui-icon-triangle-1-w'></span></a>",
                x = "<a id='" + f + "' class='fm-button ui-state-default ui-corner-right'><span class='ui-icon ui-icon-triangle-1-e'></span></a>",
                F = "<a id='cData' class='fm-button ui-state-default ui-corner-all'>" + d.bClose + "</a>";
                if (g > 0) {
                    var e = [];
                    b.each(b(l)[0].rows,
                    function(H, I) {
                        e[H] = I
                    });
                    e.sort(function(I, H) {
                        if (I.rp > H.rp) {
                            return 1
                        }
                        if (I.rp < H.rp) {
                            return - 1
                        }
                        return 0
                    });
                    b.each(e,
                    function(H, I) {
                        b("tbody", l).append(I)
                    })
                }
                d.gbox = "#gbox_" + b.jgrid.jqID(s);
                var D = b("<div></div>").append(E).append("<table border='0' class='EditTable' id='" + u + "_2'><tbody><tr id='Act_Buttons'><td class='navButton' width='" + d.labelswidth + "'>" + (z ? x + w: w + x) + "</td><td class='EditButton'>" + F + "</td></tr></tbody></table>");
                b.jgrid.createModal(j, D, d, "#gview_" + b.jgrid.jqID(y.p.id), b("#gview_" + b.jgrid.jqID(y.p.id))[0]);
                if (z) {
                    b("#pData, #nData", "#" + u + "_2").css("float", "right");
                    b(".EditButton", "#" + u + "_2").css("text-align", "left")
                }
                if (!d.viewPagerButtons) {
                    b("#pData, #nData", "#" + u + "_2").hide()
                }
                D = null;
                b("#" + j.themodal).keydown(function(H) {
                    if (H.which === 27) {
                        if (a[y.p.id].closeOnEscape) {
                            b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                                gb: d.gbox,
                                jqm: d.jqModal,
                                onClose: d.onClose,
                                removemodal: a[y.p.id].removemodal,
                                formprop: !a[y.p.id].recreateForm,
                                form: a[y.p.id].form
                            })
                        }
                        return false
                    }
                    if (d.navkeys[0] === true) {
                        if (H.which === d.navkeys[1]) {
                            b("#pData", "#" + u + "_2").trigger("click");
                            return false
                        }
                        if (H.which === d.navkeys[2]) {
                            b("#nData", "#" + u + "_2").trigger("click");
                            return false
                        }
                    }
                });
                d.closeicon = b.extend([true, "left", "ui-icon-close"], d.closeicon);
                if (d.closeicon[0] === true) {
                    b("#cData", "#" + u + "_2").addClass(d.closeicon[1] === "right" ? "fm-button-icon-right": "fm-button-icon-left").append("<span class='ui-icon " + d.closeicon[2] + "'></span>")
                }
                if (b.isFunction(d.beforeShowForm)) {
                    d.beforeShowForm.call(y, b("#" + C))
                }
                b.jgrid.viewModal("#" + b.jgrid.jqID(j.themodal), {
                    gbox: "#gbox_" + b.jgrid.jqID(s),
                    jqm: d.jqModal,
                    overlay: d.overlay,
                    modal: d.modal,
                    onHide: function(H) {
                        b(y).data("viewProp", {
                            top: parseFloat(b(H.w).css("top")),
                            left: parseFloat(b(H.w).css("left")),
                            width: b(H.w).width(),
                            height: b(H.w).height(),
                            dataheight: b("#" + C).height(),
                            datawidth: b("#" + C).width()
                        });
                        H.w.remove();
                        if (H.o) {
                            H.o.remove()
                        }
                    }
                });
                b(".fm-button:not(.ui-state-disabled)", "#" + u + "_2").hover(function() {
                    b(this).addClass("ui-state-hover")
                },
                function() {
                    b(this).removeClass("ui-state-hover")
                });
                k();
                b("#cData", "#" + u + "_2").click(function() {
                    b.jgrid.hideModal("#" + b.jgrid.jqID(j.themodal), {
                        gb: "#gbox_" + b.jgrid.jqID(s),
                        jqm: d.jqModal,
                        onClose: d.onClose,
                        removemodal: a[y.p.id].removemodal,
                        formprop: !a[y.p.id].recreateForm,
                        form: a[y.p.id].form
                    });
                    return false
                });
                b("#nData", "#" + u + "_2").click(function() {
                    b("#FormError", "#" + u).hide();
                    var H = i();
                    H[0] = parseInt(H[0], 10);
                    if (H[0] !== -1 && H[1][H[0] + 1]) {
                        if (b.isFunction(d.onclickPgButtons)) {
                            d.onclickPgButtons.call(y, "next", b("#" + C), H[1][H[0]])
                        }
                        n(H[1][H[0] + 1], y);
                        b(y).jqGrid("setSelection", H[1][H[0] + 1]);
                        if (b.isFunction(d.afterclickPgButtons)) {
                            d.afterclickPgButtons.call(y, "next", b("#" + C), H[1][H[0] + 1])
                        }
                        q(H[0] + 1, H)
                    }
                    k();
                    return false
                });
                b("#pData", "#" + u + "_2").click(function() {
                    b("#FormError", "#" + u).hide();
                    var H = i();
                    if (H[0] !== -1 && H[1][H[0] - 1]) {
                        if (b.isFunction(d.onclickPgButtons)) {
                            d.onclickPgButtons.call(y, "prev", b("#" + C), H[1][H[0]])
                        }
                        n(H[1][H[0] - 1], y);
                        b(y).jqGrid("setSelection", H[1][H[0] - 1]);
                        if (b.isFunction(d.afterclickPgButtons)) {
                            d.afterclickPgButtons.call(y, "prev", b("#" + C), H[1][H[0] - 1])
                        }
                        q(H[0] - 1, H)
                    }
                    k();
                    return false
                });
                var r = i();
                q(r[0], r)
            })
        },
        delGridRow: function(c, d) {
            d = b.extend(true, {
                top: 0,
                left: 0,
                width: 240,
                height: "auto",
                dataheight: "auto",
                modal: false,
                overlay: 30,
                drag: true,
                resize: true,
                url: "",
                mtype: "POST",
                reloadAfterSubmit: true,
                beforeShowForm: null,
                beforeInitData: null,
                afterShowForm: null,
                beforeSubmit: null,
                onclickSubmit: null,
                afterSubmit: null,
                jqModal: true,
                closeOnEscape: false,
                delData: {},
                delicon: [],
                cancelicon: [],
                onClose: null,
                ajaxDelOptions: {},
                processing: false,
                serializeDelData: null,
                useDataProxy: false
            },
            b.jgrid.del, d || {});
            a[b(this)[0].p.id] = d;
            return this.each(function() {
                var s = this;
                if (!s.grid) {
                    return
                }
                if (!c) {
                    return
                }
                var w = b.isFunction(a[s.p.id].beforeShowForm),
                j = b.isFunction(a[s.p.id].afterShowForm),
                u = b.isFunction(a[s.p.id].beforeInitData) ? a[s.p.id].beforeInitData: false,
                k = s.p.id,
                m = {},
                i = true,
                g = "DelTbl_" + b.jgrid.jqID(k),
                r,
                p,
                l,
                n,
                e = "DelTbl_" + k,
                f = {
                    themodal: "delmod" + k,
                    modalhead: "delhd" + k,
                    modalcontent: "delcnt" + k,
                    scrollelm: g
                };
                if (b.isArray(c)) {
                    c = c.join()
                }
                if (b("#" + b.jgrid.jqID(f.themodal))[0] !== undefined) {
                    if (u) {
                        i = u.call(s, b("#" + g));
                        if (i === undefined) {
                            i = true
                        }
                    }
                    if (i === false) {
                        return
                    }
                    b("#DelData>td", "#" + g).text(c);
                    b("#DelError", "#" + g).hide();
                    if (a[s.p.id].processing === true) {
                        a[s.p.id].processing = false;
                        b("#dData", "#" + g).removeClass("ui-state-active")
                    }
                    if (w) {
                        a[s.p.id].beforeShowForm.call(s, b("#" + g))
                    }
                    b.jgrid.viewModal("#" + b.jgrid.jqID(f.themodal), {
                        gbox: "#gbox_" + b.jgrid.jqID(k),
                        jqm: a[s.p.id].jqModal,
                        jqM: false,
                        overlay: a[s.p.id].overlay,
                        modal: a[s.p.id].modal
                    });
                    if (j) {
                        a[s.p.id].afterShowForm.call(s, b("#" + g))
                    }
                } else {
                    var t = isNaN(a[s.p.id].dataheight) ? a[s.p.id].dataheight: a[s.p.id].dataheight + "px",
                    o = isNaN(d.datawidth) ? d.datawidth: d.datawidth + "px",
                    h = "<div id='" + e + "' class='formdata' style='width:" + o + ";overflow:auto;position:relative;height:" + t + ";'>";
                    h += "<table class='DelTable'><tbody>";
                    h += "<tr id='DelError' style='display:none'><td class='ui-state-error'></td></tr>";
                    h += "<tr id='DelData' style='display:none'><td >" + c + "</td></tr>";
                    h += '<tr><td class="delmsg" style="white-space:pre;">' + a[s.p.id].msg + "</td></tr><tr><td >&#160;</td></tr>";
                    h += "</tbody></table></div>";
                    var q = "<a id='dData' class='fm-button ui-state-default ui-corner-all'>" + d.bSubmit + "</a>",
                    v = "<a id='eData' class='fm-button ui-state-default ui-corner-all'>" + d.bCancel + "</a>";
                    h += "<table cellspacing='0' cellpadding='0' border='0' class='EditTable' id='" + g + "_2'><tbody><tr><td><hr class='ui-widget-content' style='margin:1px'/></td></tr><tr><td class='DelButton EditButton'>" + q + "&#160;" + v + "</td></tr></tbody></table>";
                    d.gbox = "#gbox_" + b.jgrid.jqID(k);
                    b.jgrid.createModal(f, h, d, "#gview_" + b.jgrid.jqID(s.p.id), b("#gview_" + b.jgrid.jqID(s.p.id))[0]);
                    if (u) {
                        i = u.call(s, b(h));
                        if (i === undefined) {
                            i = true
                        }
                    }
                    if (i === false) {
                        return
                    }
                    b(".fm-button", "#" + g + "_2").hover(function() {
                        b(this).addClass("ui-state-hover")
                    },
                    function() {
                        b(this).removeClass("ui-state-hover")
                    });
                    d.delicon = b.extend([true, "left", "ui-icon-scissors"], a[s.p.id].delicon);
                    d.cancelicon = b.extend([true, "left", "ui-icon-cancel"], a[s.p.id].cancelicon);
                    if (d.delicon[0] === true) {
                        b("#dData", "#" + g + "_2").addClass(d.delicon[1] === "right" ? "fm-button-icon-right": "fm-button-icon-left").append("<span class='ui-icon " + d.delicon[2] + "'></span>")
                    }
                    if (d.cancelicon[0] === true) {
                        b("#eData", "#" + g + "_2").addClass(d.cancelicon[1] === "right" ? "fm-button-icon-right": "fm-button-icon-left").append("<span class='ui-icon " + d.cancelicon[2] + "'></span>")
                    }
                    b("#dData", "#" + g + "_2").click(function() {
                        var z = [true, ""],
                        B,
                        A = b("#DelData>td", "#" + g).text();
                        m = {};
                        if (b.isFunction(a[s.p.id].onclickSubmit)) {
                            m = a[s.p.id].onclickSubmit.call(s, a[s.p.id], A) || {}
                        }
                        if (b.isFunction(a[s.p.id].beforeSubmit)) {
                            z = a[s.p.id].beforeSubmit.call(s, A)
                        }
                        if (z[0] && !a[s.p.id].processing) {
                            a[s.p.id].processing = true;
                            l = s.p.prmNames;
                            r = b.extend({},
                            a[s.p.id].delData, m);
                            n = l.oper;
                            r[n] = l.deloper;
                            p = l.id;
                            A = String(A).split(",");
                            if (!A.length) {
                                return false
                            }
                            for (B in A) {
                                if (A.hasOwnProperty(B)) {
                                    A[B] = b.jgrid.stripPref(s.p.idPrefix, A[B])
                                }
                            }
                            r[p] = A.join();
                            b(this).addClass("ui-state-active");
                            var x = b.extend({
                                url: a[s.p.id].url || b(s).jqGrid("getGridParam", "editurl"),
                                type: a[s.p.id].mtype,
                                data: b.isFunction(a[s.p.id].serializeDelData) ? a[s.p.id].serializeDelData.call(s, r) : r,
                                complete: function(E, C) {
                                    var D;
                                    b("#dData", "#" + g + "_2").removeClass("ui-state-active");
                                    if (E.status >= 300 && E.status !== 304) {
                                        z[0] = false;
                                        if (b.isFunction(a[s.p.id].errorTextFormat)) {
                                            z[1] = a[s.p.id].errorTextFormat.call(s, E)
                                        } else {
                                            z[1] = C + " Status: '" + E.statusText + "'. Error code: " + E.status
                                        }
                                    } else {
                                        if (b.isFunction(a[s.p.id].afterSubmit)) {
                                            z = a[s.p.id].afterSubmit.call(s, E, r)
                                        }
                                    }
                                    if (z[0] === false) {
                                        b("#DelError>td", "#" + g).html(z[1]);
                                        b("#DelError", "#" + g).show()
                                    } else {
                                        if (a[s.p.id].reloadAfterSubmit && s.p.datatype !== "local") {
                                            b(s).trigger("reloadGrid")
                                        } else {
                                            if (s.p.treeGrid === true) {
                                                try {
                                                    b(s).jqGrid("delTreeNode", s.p.idPrefix + A[0])
                                                } catch(F) {}
                                            } else {
                                                for (D = 0; D < A.length; D++) {
                                                    b(s).jqGrid("delRowData", s.p.idPrefix + A[D])
                                                }
                                            }
                                            s.p.selrow = null;
                                            s.p.selarrrow = []
                                        }
                                        if (b.isFunction(a[s.p.id].afterComplete)) {
                                            setTimeout(function() {
                                                a[s.p.id].afterComplete.call(s, E, A)
                                            },
                                            500)
                                        }
                                    }
                                    a[s.p.id].processing = false;
                                    if (z[0]) {
                                        b.jgrid.hideModal("#" + b.jgrid.jqID(f.themodal), {
                                            gb: "#gbox_" + b.jgrid.jqID(k),
                                            jqm: d.jqModal,
                                            onClose: a[s.p.id].onClose
                                        })
                                    }
                                }
                            },
                            b.jgrid.ajaxOptions, a[s.p.id].ajaxDelOptions);
                            if (!x.url && !a[s.p.id].useDataProxy) {
                                if (b.isFunction(s.p.dataProxy)) {
                                    a[s.p.id].useDataProxy = true
                                } else {
                                    z[0] = false;
                                    z[1] += " " + b.jgrid.errors.nourl
                                }
                            }
                            if (z[0]) {
                                if (a[s.p.id].useDataProxy) {
                                    var y = s.p.dataProxy.call(s, x, "del_" + s.p.id);
                                    if (y === undefined) {
                                        y = [true, ""]
                                    }
                                    if (y[0] === false) {
                                        z[0] = false;
                                        z[1] = y[1] || "Error deleting the selected row!"
                                    } else {
                                        b.jgrid.hideModal("#" + b.jgrid.jqID(f.themodal), {
                                            gb: "#gbox_" + b.jgrid.jqID(k),
                                            jqm: d.jqModal,
                                            onClose: a[s.p.id].onClose
                                        })
                                    }
                                } else {
                                    if (x.url === "clientArray") {
                                        r = x.data;
                                        x.complete({
                                            status: 200,
                                            statusText: ""
                                        },
                                        "")
                                    } else {
                                        b.ajax(x)
                                    }
                                }
                            }
                        }
                        if (z[0] === false) {
                            b("#DelError>td", "#" + g).html(z[1]);
                            b("#DelError", "#" + g).show()
                        }
                        return false
                    });
                    b("#eData", "#" + g + "_2").click(function() {
                        b.jgrid.hideModal("#" + b.jgrid.jqID(f.themodal), {
                            gb: "#gbox_" + b.jgrid.jqID(k),
                            jqm: a[s.p.id].jqModal,
                            onClose: a[s.p.id].onClose
                        });
                        return false
                    });
                    if (w) {
                        a[s.p.id].beforeShowForm.call(s, b("#" + g))
                    }
                    b.jgrid.viewModal("#" + b.jgrid.jqID(f.themodal), {
                        gbox: "#gbox_" + b.jgrid.jqID(k),
                        jqm: a[s.p.id].jqModal,
                        overlay: a[s.p.id].overlay,
                        modal: a[s.p.id].modal
                    });
                    if (j) {
                        a[s.p.id].afterShowForm.call(s, b("#" + g))
                    }
                }
                if (a[s.p.id].closeOnEscape === true) {
                    setTimeout(function() {
                        b(".ui-jqdialog-titlebar-close", "#" + b.jgrid.jqID(f.modalhead)).attr("tabindex", "-1").focus()
                    },
                    0)
                }
            })
        },
        navGrid: function(f, h, e, g, d, c, i) {
            h = b.extend({
                edit: true,
                editicon: "ui-icon-pencil",
                add: true,
                addicon: "ui-icon-plus",
                del: true,
                delicon: "ui-icon-trash",
                search: true,
                searchicon: "ui-icon-search",
                refresh: true,
                refreshicon: "ui-icon-refresh",
                refreshstate: "firstpage",
                view: false,
                viewicon: "ui-icon-document",
                position: "left",
                closeOnEscape: true,
                beforeRefresh: null,
                afterRefresh: null,
                cloneToTop: false,
                alertwidth: 200,
                alertheight: "auto",
                alerttop: null,
                alertleft: null,
                alertzIndex: null
            },
            b.jgrid.nav, h || {});
            return this.each(function() {
                if (this.nav) {
                    return
                }
                var j = {
                    themodal: "alertmod_" + this.p.id,
                    modalhead: "alerthd_" + this.p.id,
                    modalcontent: "alertcnt_" + this.p.id
                },
                m = this,
                p,
                k;
                if (!m.grid || typeof f !== "string") {
                    return
                }
                if (b("#" + j.themodal)[0] === undefined) {
                    if (!h.alerttop && !h.alertleft) {
                        if (window.innerWidth !== undefined) {
                            h.alertleft = window.innerWidth;
                            h.alerttop = window.innerHeight
                        } else {
                            if (document.documentElement !== undefined && document.documentElement.clientWidth !== undefined && document.documentElement.clientWidth !== 0) {
                                h.alertleft = document.documentElement.clientWidth;
                                h.alerttop = document.documentElement.clientHeight
                            } else {
                                h.alertleft = 1024;
                                h.alerttop = 768
                            }
                        }
                        h.alertleft = h.alertleft / 2 - parseInt(h.alertwidth, 10) / 2;
                        h.alerttop = h.alerttop / 2 - 25
                    }
                    b.jgrid.createModal(j, "<div>" + h.alerttext + "</div><span tabindex='0'><span tabindex='-1' id='jqg_alrt'></span></span>", {
                        gbox: "#gbox_" + b.jgrid.jqID(m.p.id),
                        jqModal: true,
                        drag: true,
                        resize: true,
                        caption: h.alertcap,
                        top: h.alerttop,
                        left: h.alertleft,
                        width: h.alertwidth,
                        height: h.alertheight,
                        closeOnEscape: h.closeOnEscape,
                        zIndex: h.alertzIndex
                    },
                    "#gview_" + b.jgrid.jqID(m.p.id), b("#gbox_" + b.jgrid.jqID(m.p.id))[0], true)
                }
                var q = 1,
                n, o = function() {
                    if (!b(this).hasClass("ui-state-disabled")) {
                        b(this).addClass("ui-state-hover")
                    }
                },
                r = function() {
                    b(this).removeClass("ui-state-hover")
                };
                if (h.cloneToTop && m.p.toppager) {
                    q = 2
                }
                for (n = 0; n < q; n++) {
                    var s, u = b("<table cellspacing='0' cellpadding='0' border='0' class='ui-pg-table navtable' style='float:left;table-layout:auto;'><tbody><tr></tr></tbody></table>"),
                    v = "<td class='ui-pg-button ui-state-disabled' style='width:4px;'><span class='ui-separator'></span></td>",
                    l,
                    t;
                    if (n === 0) {
                        l = f;
                        t = m.p.id;
                        if (l === m.p.toppager) {
                            t += "_top";
                            q = 1
                        }
                    } else {
                        l = m.p.toppager;
                        t = m.p.id + "_top"
                    }
                    if (m.p.direction === "rtl") {
                        b(u).attr("dir", "rtl").css("float", "right")
                    }
                    if (h.add) {
                        g = g || {};
                        s = b("<td class='ui-pg-button ui-corner-all'></td>");
                        b(s).append("<div class='ui-pg-div'><span class='ui-icon " + h.addicon + "'></span>" + h.addtext + "</div>");
                        b("tr", u).append(s);
                        b(s, u).attr({
                            title: h.addtitle || "",
                            id: g.id || "add_" + t
                        }).click(function() {
                            if (!b(this).hasClass("ui-state-disabled")) {
                                if (b.isFunction(h.addfunc)) {
                                    h.addfunc.call(m)
                                } else {
                                    b(m).jqGrid("editGridRow", "new", g)
                                }
                            }
                            return false
                        }).hover(o, r);
                        s = null
                    }
                    if (h.edit) {
                        s = b("<td class='ui-pg-button ui-corner-all'></td>");
                        e = e || {};
                        b(s).append("<div class='ui-pg-div'><span class='ui-icon " + h.editicon + "'></span>" + h.edittext + "</div>");
                        b("tr", u).append(s);
                        b(s, u).attr({
                            title: h.edittitle || "",
                            id: e.id || "edit_" + t
                        }).click(function() {
                            if (!b(this).hasClass("ui-state-disabled")) {
                                var w = m.p.selrow;
                                if (w) {
                                    if (b.isFunction(h.editfunc)) {
                                        h.editfunc.call(m, w)
                                    } else {
                                        b(m).jqGrid("editGridRow", w, e)
                                    }
                                } else {
                                    b.jgrid.viewModal("#" + j.themodal, {
                                        gbox: "#gbox_" + b.jgrid.jqID(m.p.id),
                                        jqm: true
                                    });
                                    b("#jqg_alrt").focus()
                                }
                            }
                            return false
                        }).hover(o, r);
                        s = null
                    }
                    if (h.view) {
                        s = b("<td class='ui-pg-button ui-corner-all'></td>");
                        i = i || {};
                        b(s).append("<div class='ui-pg-div'><span class='ui-icon " + h.viewicon + "'></span>" + h.viewtext + "</div>");
                        b("tr", u).append(s);
                        b(s, u).attr({
                            title: h.viewtitle || "",
                            id: i.id || "view_" + t
                        }).click(function() {
                            if (!b(this).hasClass("ui-state-disabled")) {
                                var w = m.p.selrow;
                                if (w) {
                                    if (b.isFunction(h.viewfunc)) {
                                        h.viewfunc.call(m, w)
                                    } else {
                                        b(m).jqGrid("viewGridRow", w, i)
                                    }
                                } else {
                                    b.jgrid.viewModal("#" + j.themodal, {
                                        gbox: "#gbox_" + b.jgrid.jqID(m.p.id),
                                        jqm: true
                                    });
                                    b("#jqg_alrt").focus()
                                }
                            }
                            return false
                        }).hover(o, r);
                        s = null
                    }
                    if (h.del) {
                        s = b("<td class='ui-pg-button ui-corner-all'></td>");
                        d = d || {};
                        b(s).append("<div class='ui-pg-div'><span class='ui-icon " + h.delicon + "'></span>" + h.deltext + "</div>");
                        b("tr", u).append(s);
                        b(s, u).attr({
                            title: h.deltitle || "",
                            id: d.id || "del_" + t
                        }).click(function() {
                            if (!b(this).hasClass("ui-state-disabled")) {
                                var w;
                                if (m.p.multiselect) {
                                    w = m.p.selarrrow;
                                    if (w.length === 0) {
                                        w = null
                                    }
                                } else {
                                    w = m.p.selrow
                                }
                                if (w) {
                                    if (b.isFunction(h.delfunc)) {
                                        h.delfunc.call(m, w)
                                    } else {
                                        b(m).jqGrid("delGridRow", w, d)
                                    }
                                } else {
                                    b.jgrid.viewModal("#" + j.themodal, {
                                        gbox: "#gbox_" + b.jgrid.jqID(m.p.id),
                                        jqm: true
                                    });
                                    b("#jqg_alrt").focus()
                                }
                            }
                            return false
                        }).hover(o, r);
                        s = null
                    }
                    if (h.add || h.edit || h.del || h.view) {
                        b("tr", u).append(v)
                    }
                    if (h.search) {
                        s = b("<td class='ui-pg-button ui-corner-all'></td>");
                        c = c || {};
                        b(s).append("<div class='ui-pg-div'><span class='ui-icon " + h.searchicon + "'></span>" + h.searchtext + "</div>");
                        b("tr", u).append(s);
                        b(s, u).attr({
                            title: h.searchtitle || "",
                            id: c.id || "search_" + t
                        }).click(function() {
                            if (!b(this).hasClass("ui-state-disabled")) {
                                if (b.isFunction(h.searchfunc)) {
                                    h.searchfunc.call(m, c)
                                } else {
                                    b(m).jqGrid("searchGrid", c)
                                }
                            }
                            return false
                        }).hover(o, r);
                        if (c.showOnLoad && c.showOnLoad === true) {
                            b(s, u).click()
                        }
                        s = null
                    }
                    if (h.refresh) {
                        s = b("<td class='ui-pg-button ui-corner-all'></td>");
                        b(s).append("<div class='ui-pg-div'><span class='ui-icon " + h.refreshicon + "'></span>" + h.refreshtext + "</div>");
                        b("tr", u).append(s);
                        b(s, u).attr({
                            title: h.refreshtitle || "",
                            id: "refresh_" + t
                        }).click(function() {
                            if (!b(this).hasClass("ui-state-disabled")) {
                                if (b.isFunction(h.beforeRefresh)) {
                                    h.beforeRefresh.call(m)
                                }
                                m.p.search = false;
                                m.p.resetsearch = true;
                                try {
                                    if (h.refreshstate !== "currentfilter") {
                                        var x = m.p.id;
                                        m.p.postData.filters = "";
                                        try {
                                            b("#fbox_" + b.jgrid.jqID(x)).jqFilter("resetFilter")
                                        } catch(w) {}
                                        if (b.isFunction(m.clearToolbar)) {
                                            m.clearToolbar.call(m, false)
                                        }
                                    }
                                } catch(y) {}
                                switch (h.refreshstate) {
                                case "firstpage":
                                    b(m).trigger("reloadGrid", [{
                                        page: 1
                                    }]);
                                    break;
                                case "current":
                                case "currentfilter":
                                    b(m).trigger("reloadGrid", [{
                                        current: true
                                    }]);
                                    break
                                }
                                if (b.isFunction(h.afterRefresh)) {
                                    h.afterRefresh.call(m)
                                }
                            }
                            return false
                        }).hover(o, r);
                        s = null
                    }
                    k = b(".ui-jqgrid").css("font-size") || "11px";
                    b("body").append("<div id='testpg2' class='ui-jqgrid ui-widget ui-widget-content' style='font-size:" + k + ";visibility:hidden;' ></div>");
                    p = b(u).clone().appendTo("#testpg2").width();
                    b("#testpg2").remove();
                    b(l + "_" + h.position, l).append(u);
                    if (m.p._nvtd) {
                        if (p > m.p._nvtd[0]) {
                            b(l + "_" + h.position, l).width(p);
                            m.p._nvtd[0] = p
                        }
                        m.p._nvtd[1] = p
                    }
                    k = null;
                    p = null;
                    u = null;
                    this.nav = true
                }
            })
        },
        navButtonAdd: function(c, d) {
            d = b.extend({
                caption: "newButton",
                title: "",
                buttonicon: "ui-icon-newwin",
                onClickButton: null,
                position: "last",
                cursor: "pointer"
            },
            d || {});
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                if (typeof c === "string" && c.indexOf("#") !== 0) {
                    c = "#" + b.jgrid.jqID(c)
                }
                var e = b(".navtable", c)[0],
                g = this;
                if (e) {
                    if (d.id && b("#" + b.jgrid.jqID(d.id), e)[0] !== undefined) {
                        return
                    }
                    var f = b("<td></td>");
                    if (d.buttonicon.toString().toUpperCase() === "NONE") {
                        b(f).addClass("ui-pg-button ui-corner-all").append("<div class='ui-pg-div'>" + d.caption + "</div>")
                    } else {
                        b(f).addClass("ui-pg-button ui-corner-all").append("<div class='ui-pg-div'><span class='ui-icon " + d.buttonicon + "'></span>" + d.caption + "</div>")
                    }
                    if (d.id) {
                        b(f).attr("id", d.id)
                    }
                    if (d.position === "first") {
                        if (e.rows[0].cells.length === 0) {
                            b("tr", e).append(f)
                        } else {
                            b("tr td:eq(0)", e).before(f)
                        }
                    } else {
                        b("tr", e).append(f)
                    }
                    b(f, e).attr("title", d.title || "").click(function(h) {
                        if (!b(this).hasClass("ui-state-disabled")) {
                            if (b.isFunction(d.onClickButton)) {
                                d.onClickButton.call(g, h)
                            }
                        }
                        return false
                    }).hover(function() {
                        if (!b(this).hasClass("ui-state-disabled")) {
                            b(this).addClass("ui-state-hover")
                        }
                    },
                    function() {
                        b(this).removeClass("ui-state-hover")
                    })
                }
            })
        },
        navSeparatorAdd: function(c, d) {
            d = b.extend({
                sepclass: "ui-separator",
                sepcontent: "",
                position: "last"
            },
            d || {});
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                if (typeof c === "string" && c.indexOf("#") !== 0) {
                    c = "#" + b.jgrid.jqID(c)
                }
                var f = b(".navtable", c)[0];
                if (f) {
                    var e = "<td class='ui-pg-button ui-state-disabled' style='width:4px;'><span class='" + d.sepclass + "'></span>" + d.sepcontent + "</td>";
                    if (d.position === "first") {
                        if (f.rows[0].cells.length === 0) {
                            b("tr", f).append(e)
                        } else {
                            b("tr td:eq(0)", f).before(e)
                        }
                    } else {
                        b("tr", f).append(e)
                    }
                }
            })
        },
        GridToForm: function(c, d) {
            return this.each(function() {
                var g = this,
                e;
                if (!g.grid) {
                    return
                }
                var f = b(g).jqGrid("getRowData", c);
                if (f) {
                    for (e in f) {
                        if (f.hasOwnProperty(e)) {
                            if (b("[name=" + b.jgrid.jqID(e) + "]", d).is("input:radio") || b("[name=" + b.jgrid.jqID(e) + "]", d).is("input:checkbox")) {
                                b("[name=" + b.jgrid.jqID(e) + "]", d).each(function() {
                                    if (b(this).val() == f[e]) {
                                        b(this)[g.p.useProp ? "prop": "attr"]("checked", true)
                                    } else {
                                        b(this)[g.p.useProp ? "prop": "attr"]("checked", false)
                                    }
                                })
                            } else {
                                b("[name=" + b.jgrid.jqID(e) + "]", d).val(f[e])
                            }
                        }
                    }
                }
            })
        },
        FormToGrid: function(d, e, f, c) {
            return this.each(function() {
                var i = this;
                if (!i.grid) {
                    return
                }
                if (!f) {
                    f = "set"
                }
                if (!c) {
                    c = "first"
                }
                var g = b(e).serializeArray();
                var h = {};
                b.each(g,
                function(j, k) {
                    h[k.name] = k.value
                });
                if (f === "add") {
                    b(i).jqGrid("addRowData", d, h, c)
                } else {
                    if (f === "set") {
                        b(i).jqGrid("setRowData", d, h)
                    }
                }
            })
        }
    })
})(jQuery); (function(a) {
    a.extend(a.jgrid, {
        template: function(e) {
            var c = a.makeArray(arguments).slice(1),
            b,
            d = c.length;
            if (e == null) {
                e = ""
            }
            return e.replace(/\{([\w\-]+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?\}/g,
            function(f, j) {
                if (!isNaN(parseInt(j, 10))) {
                    return c[parseInt(j, 10)]
                }
                for (b = 0; b < d; b++) {
                    if (a.isArray(c[b])) {
                        var h = c[b],
                        g = h.length;
                        while (g--) {
                            if (j === h[g].nm) {
                                return h[g].v
                            }
                        }
                    }
                }
            })
        }
    });
    a.jgrid.extend({
        groupingSetup: function() {
            return this.each(function() {
                var g = this,
                e, d, f, c = g.p.colModel,
                b = g.p.groupingView;
                if (b !== null && ((typeof b === "object") || a.isFunction(b))) {
                    if (!b.groupField.length) {
                        g.p.grouping = false
                    } else {
                        if (b.visibiltyOnNextGrouping === undefined) {
                            b.visibiltyOnNextGrouping = []
                        }
                        b.lastvalues = [];
                        if (!b._locgr) {
                            b.groups = []
                        }
                        b.counters = [];
                        for (e = 0; e < b.groupField.length; e++) {
                            if (!b.groupOrder[e]) {
                                b.groupOrder[e] = "asc"
                            }
                            if (!b.groupText[e]) {
                                b.groupText[e] = "{0}"
                            }
                            if (typeof b.groupColumnShow[e] !== "boolean") {
                                b.groupColumnShow[e] = true
                            }
                            if (typeof b.groupSummary[e] !== "boolean") {
                                b.groupSummary[e] = false
                            }
                            if (!b.groupSummaryPos[e]) {
                                b.groupSummaryPos[e] = "footer"
                            }
                            if (b.groupColumnShow[e] === true) {
                                b.visibiltyOnNextGrouping[e] = true;
                                a(g).jqGrid("showCol", b.groupField[e])
                            } else {
                                b.visibiltyOnNextGrouping[e] = a("#" + a.jgrid.jqID(g.p.id + "_" + b.groupField[e])).is(":visible");
                                a(g).jqGrid("hideCol", b.groupField[e])
                            }
                        }
                        b.summary = [];
                        if (b.hideFirstGroupCol) {
                            b.formatDisplayField[0] = function(h) {
                                return h
                            }
                        }
                        for (d = 0, f = c.length; d < f; d++) {
                            if (b.hideFirstGroupCol) {
                                if (!c[d].hidden && b.groupField[0] === c[d].name) {
                                    c[d].formatter = function() {
                                        return ""
                                    }
                                }
                            }
                            if (c[d].summaryType) {
                                if (c[d].summaryDivider) {
                                    b.summary.push({
                                        nm: c[d].name,
                                        st: c[d].summaryType,
                                        v: "",
                                        sd: c[d].summaryDivider,
                                        vd: "",
                                        sr: c[d].summaryRound,
                                        srt: c[d].summaryRoundType || "round"
                                    })
                                } else {
                                    b.summary.push({
                                        nm: c[d].name,
                                        st: c[d].summaryType,
                                        v: "",
                                        sr: c[d].summaryRound,
                                        srt: c[d].summaryRoundType || "round"
                                    })
                                }
                            }
                        }
                    }
                } else {
                    g.p.grouping = false
                }
            })
        },
        groupingPrepare: function(b, c) {
            this.each(function() {
                var l = this.p.groupingView,
                e = this,
                f, k = l.groupField.length,
                m, j, h, g, d = 0;
                for (f = 0; f < k; f++) {
                    m = l.groupField[f];
                    h = l.displayField[f];
                    j = b[m];
                    g = h == null ? null: b[h];
                    if (g == null) {
                        g = j
                    }
                    if (j !== undefined) {
                        if (c === 0) {
                            l.groups.push({
                                idx: f,
                                dataIndex: m,
                                value: j,
                                displayValue: g,
                                startRow: c,
                                cnt: 1,
                                summary: []
                            });
                            l.lastvalues[f] = j;
                            l.counters[f] = {
                                cnt: 1,
                                pos: l.groups.length - 1,
                                summary: a.extend(true, [], l.summary)
                            };
                            a.each(l.counters[f].summary,
                            function() {
                                if (a.isFunction(this.st)) {
                                    this.v = this.st.call(e, this.v, this.nm, b)
                                } else {
                                    this.v = a(e).jqGrid("groupingCalculations.handler", this.st, this.v, this.nm, this.sr, this.srt, b);
                                    if (this.st.toLowerCase() === "avg" && this.sd) {
                                        this.vd = a(e).jqGrid("groupingCalculations.handler", this.st, this.vd, this.sd, this.sr, this.srt, b)
                                    }
                                }
                            });
                            l.groups[l.counters[f].pos].summary = l.counters[f].summary
                        } else {
                            if (typeof j !== "object" && (a.isArray(l.isInTheSameGroup) && a.isFunction(l.isInTheSameGroup[f]) ? !l.isInTheSameGroup[f].call(e, l.lastvalues[f], j, f, l) : l.lastvalues[f] !== j)) {
                                l.groups.push({
                                    idx: f,
                                    dataIndex: m,
                                    value: j,
                                    displayValue: g,
                                    startRow: c,
                                    cnt: 1,
                                    summary: []
                                });
                                l.lastvalues[f] = j;
                                d = 1;
                                l.counters[f] = {
                                    cnt: 1,
                                    pos: l.groups.length - 1,
                                    summary: a.extend(true, [], l.summary)
                                };
                                a.each(l.counters[f].summary,
                                function() {
                                    if (a.isFunction(this.st)) {
                                        this.v = this.st.call(e, this.v, this.nm, b)
                                    } else {
                                        this.v = a(e).jqGrid("groupingCalculations.handler", this.st, this.v, this.nm, this.sr, this.srt, b);
                                        if (this.st.toLowerCase() === "avg" && this.sd) {
                                            this.vd = a(e).jqGrid("groupingCalculations.handler", this.st, this.vd, this.sd, this.sr, this.srt, b)
                                        }
                                    }
                                });
                                l.groups[l.counters[f].pos].summary = l.counters[f].summary
                            } else {
                                if (d === 1) {
                                    l.groups.push({
                                        idx: f,
                                        dataIndex: m,
                                        value: j,
                                        displayValue: g,
                                        startRow: c,
                                        cnt: 1,
                                        summary: []
                                    });
                                    l.lastvalues[f] = j;
                                    l.counters[f] = {
                                        cnt: 1,
                                        pos: l.groups.length - 1,
                                        summary: a.extend(true, [], l.summary)
                                    };
                                    a.each(l.counters[f].summary,
                                    function() {
                                        if (a.isFunction(this.st)) {
                                            this.v = this.st.call(e, this.v, this.nm, b)
                                        } else {
                                            this.v = a(e).jqGrid("groupingCalculations.handler", this.st, this.v, this.nm, this.sr, this.srt, b);
                                            if (this.st.toLowerCase() === "avg" && this.sd) {
                                                this.vd = a(e).jqGrid("groupingCalculations.handler", this.st, this.vd, this.sd, this.sr, this.srt, b)
                                            }
                                        }
                                    });
                                    l.groups[l.counters[f].pos].summary = l.counters[f].summary
                                } else {
                                    l.counters[f].cnt += 1;
                                    l.groups[l.counters[f].pos].cnt = l.counters[f].cnt;
                                    a.each(l.counters[f].summary,
                                    function() {
                                        if (a.isFunction(this.st)) {
                                            this.v = this.st.call(e, this.v, this.nm, b)
                                        } else {
                                            this.v = a(e).jqGrid("groupingCalculations.handler", this.st, this.v, this.nm, this.sr, this.srt, b);
                                            if (this.st.toLowerCase() === "avg" && this.sd) {
                                                this.vd = a(e).jqGrid("groupingCalculations.handler", this.st, this.vd, this.sd, this.sr, this.srt, b)
                                            }
                                        }
                                    });
                                    l.groups[l.counters[f].pos].summary = l.counters[f].summary
                                }
                            }
                        }
                    }
                }
            });
            return this
        },
        groupingToggle: function(b) {
            this.each(function() {
                var j = this,
                q = j.p.groupingView,
                f = b.split("_"),
                l = parseInt(f[f.length - 2], 10);
                f.splice(f.length - 2, 2);
                var o = f.join("_"),
                h = q.minusicon,
                n = q.plusicon,
                m = a("#" + a.jgrid.jqID(b)),
                c = m.length ? m[0].nextSibling: null,
                p = a("#" + a.jgrid.jqID(b) + " span.tree-wrap-" + j.p.direction),
                t = function(r) {
                    var u = a.map(r.split(" "),
                    function(v) {
                        if (v.substring(0, o.length + 1) === o + "_") {
                            return parseInt(v.substring(o.length + 1), 10)
                        }
                    });
                    return u.length > 0 ? u[0] : undefined
                },
                k,
                e,
                i = false,
                g = j.p.frozenColumns ? j.p.id + "_frozen": false,
                s = g ? a("#" + a.jgrid.jqID(b), "#" + a.jgrid.jqID(g)) : false,
                d = (s && s.length) ? s[0].nextSibling: null;
                if (p.hasClass(h)) {
                    if (q.showSummaryOnHide) {
                        if (c) {
                            while (c) {
                                k = t(c.className);
                                if (k !== undefined && k <= l) {
                                    break
                                }
                                a(c).hide();
                                c = c.nextSibling;
                                if (g) {
                                    a(d).hide();
                                    d = d.nextSibling
                                }
                            }
                        }
                    } else {
                        if (c) {
                            while (c) {
                                k = t(c.className);
                                if (k !== undefined && k <= l) {
                                    break
                                }
                                a(c).hide();
                                c = c.nextSibling;
                                if (g) {
                                    a(d).hide();
                                    d = d.nextSibling
                                }
                            }
                        }
                    }
                    p.removeClass(h).addClass(n);
                    i = true
                } else {
                    if (c) {
                        e = undefined;
                        while (c) {
                            k = t(c.className);
                            if (e === undefined) {
                                e = k === undefined
                            }
                            if (k !== undefined) {
                                if (k <= l) {
                                    break
                                }
                                if (k === l + 1) {
                                    a(c).show().find(">td>span.tree-wrap-" + j.p.direction).removeClass(h).addClass(n);
                                    if (g) {
                                        a(d).show().find(">td>span.tree-wrap-" + j.p.direction).removeClass(h).addClass(n)
                                    }
                                }
                            } else {
                                if (e) {
                                    a(c).show();
                                    if (g) {
                                        a(d).show()
                                    }
                                }
                            }
                            c = c.nextSibling;
                            if (g) {
                                d = d.nextSibling
                            }
                        }
                    }
                    p.removeClass(n).addClass(h)
                }
                a(j).triggerHandler("jqGridGroupingClickGroup", [b, i]);
                if (a.isFunction(j.p.onClickGroup)) {
                    j.p.onClickGroup.call(j, b, i)
                }
            });
            return false
        },
        groupingRender: function(d, e, c, b) {
            return this.each(function() {
                var j = this,
                s = j.p.groupingView,
                n = "",
                o = "",
                p, r, l = s.groupCollapse ? s.plusicon: s.minusicon,
                f,
                m = [],
                k = s.groupField.length;
                l += " tree-wrap-" + j.p.direction;
                a.each(j.p.colModel,
                function(u, w) {
                    var v;
                    for (v = 0; v < k; v++) {
                        if (s.groupField[v] === w.name) {
                            m[v] = u;
                            break
                        }
                    }
                });
                var i = 0;
                function t(x, y, u) {
                    var v = false,
                    w;
                    if (y === 0) {
                        v = u[x]
                    } else {
                        var z = u[x].idx;
                        if (z === 0) {
                            v = u[x]
                        } else {
                            for (w = x; w >= 0; w--) {
                                if (u[w].idx === z - y) {
                                    v = u[w];
                                    break
                                }
                            }
                        }
                    }
                    return v
                }
                function h(w, B, E, z) {
                    var x = t(w, B, E),
                    C = j.p.colModel,
                    A,
                    D = x.cnt,
                    y = "",
                    v;
                    for (v = z; v < e; v++) {
                        var u = "<td " + j.formatCol(v, 1, "") + ">&#160;</td>",
                        F = "{0}";
                        a.each(x.summary,
                        function() {
                            if (this.nm === C[v].name) {
                                if (C[v].summaryTpl) {
                                    F = C[v].summaryTpl
                                }
                                if (typeof this.st === "string" && this.st.toLowerCase() === "avg") {
                                    if (this.sd && this.vd) {
                                        this.v = (this.v / this.vd)
                                    } else {
                                        if (this.v && D > 0) {
                                            this.v = (this.v / D)
                                        }
                                    }
                                }
                                try {
                                    this.groupCount = x.cnt;
                                    this.groupIndex = x.dataIndex;
                                    this.groupValue = x.value;
                                    A = j.formatter("", this.v, v, this)
                                } catch(G) {
                                    A = this.v
                                }
                                u = "<td " + j.formatCol(v, 1, "") + ">" + a.jgrid.format(F, A) + "</td>";
                                return false
                            }
                        });
                        y += u
                    }
                    return y
                }
                var q = a.makeArray(s.groupSummary),
                g;
                q.reverse();
                g = j.p.multiselect ? ' colspan="2"': "";
                a.each(s.groups,
                function(A, x) {
                    if (s._locgr) {
                        if (! (x.startRow + x.cnt > (c - 1) * b && x.startRow < c * b)) {
                            return true
                        }
                    }
                    i++;
                    r = j.p.id + "ghead_" + x.idx;
                    p = r + "_" + A;
                    o = "<span style='cursor:pointer;' class='ui-icon " + l + "' onclick=\"jQuery('#" + a.jgrid.jqID(j.p.id) + "').jqGrid('groupingToggle','" + p + "');return false;\"></span>";
                    try {
                        if (a.isArray(s.formatDisplayField) && a.isFunction(s.formatDisplayField[x.idx])) {
                            x.displayValue = s.formatDisplayField[x.idx].call(j, x.displayValue, x.value, j.p.colModel[m[x.idx]], x.idx, s);
                            f = x.displayValue
                        } else {
                            f = j.formatter(p, x.displayValue, m[x.idx], x.value)
                        }
                    } catch(G) {
                        f = x.displayValue
                    }
                    var u = "";
                    if (a.isFunction(s.groupText[x.idx])) {
                        u = s.groupText[x.idx].call(j, f, x.cnt, x.summary)
                    } else {
                        u = a.jgrid.template(s.groupText[x.idx], f, x.cnt, x.summary)
                    }
                    if (! (typeof u === "string" || typeof u === "number")) {
                        u = f
                    }
                    if (s.groupSummaryPos[x.idx] === "header") {
                        n += '<tr id="' + p + '"' + (s.groupCollapse && x.idx > 0 ? ' style="display:none;" ': " ") + 'role="row" class= "ui-widget-content jqgroup ui-row-' + j.p.direction + " " + r + '"><td style="padding-left:' + (x.idx * 12) + 'px;"' + g + ">" + o + u + "</td>";
                        n += h(A, 0, s.groups, s.groupColumnShow[x.idx] === false ? (g === "" ? 2 : 3) : ((g === "") ? 1 : 2));
                        n += "</tr>"
                    } else {
                        if (s.groupText != "none") {
                            n += '<tr id="' + p + '"' + (s.groupCollapse && x.idx > 0 ? ' style="display:none;" ': " ") + 'role="row" class= "ui-widget-content jqgroup ui-row-' + j.p.direction + " " + r + '"><td style="padding-left:' + (x.idx * 12) + 'px;" colspan="' + (s.groupColumnShow[x.idx] === false ? e - 1 : e) + '">' + o + u + "</td></tr>"
                        }
                    }
                    var C = k - 1 === x.idx;
                    if (C) {
                        var D = s.groups[A + 1],
                        v,
                        F,
                        z = 0,
                        w = x.startRow,
                        y = D !== undefined ? D.startRow: s.groups[A].startRow + s.groups[A].cnt;
                        if (s._locgr) {
                            z = (c - 1) * b;
                            if (z > x.startRow) {
                                w = z
                            }
                        }
                        for (v = w; v < y; v++) {
                            if (!d[v - z]) {
                                break
                            }
                            n += d[v - z].join("")
                        }
                        if (s.groupSummaryPos[x.idx] !== "header") {
                            var B;
                            if (D !== undefined) {
                                for (B = 0; B < s.groupField.length; B++) {
                                    if (D.dataIndex === s.groupField[B]) {
                                        break
                                    }
                                }
                                i = s.groupField.length - B
                            }
                            for (F = 0; F < i; F++) {
                                if (!q[F]) {
                                    continue
                                }
                                var E = "";
                                if (s.groupCollapse && !s.showSummaryOnHide) {
                                    E = ' style="display:none;"'
                                }
                                n += "<tr" + E + ' jqfootlevel="' + (x.idx - F) + '" role="row" class="ui-widget-content jqfoot ui-row-' + j.p.direction + '">';
                                n += h(A, F, s.groups, 0);
                                n += "</tr>"
                            }
                            i = B
                        }
                    }
                });
                a("#" + a.jgrid.jqID(j.p.id) + " tbody:first").append(n);
                n = null
            })
        },
        groupingGroupBy: function(c, b) {
            return this.each(function() {
                var f = this;
                if (typeof c === "string") {
                    c = [c]
                }
                var d = f.p.groupingView;
                f.p.grouping = true;
                d._locgr = false;
                if (d.visibiltyOnNextGrouping === undefined) {
                    d.visibiltyOnNextGrouping = []
                }
                var e;
                for (e = 0; e < d.groupField.length; e++) {
                    if (!d.groupColumnShow[e] && d.visibiltyOnNextGrouping[e]) {
                        a(f).jqGrid("showCol", d.groupField[e])
                    }
                }
                for (e = 0; e < c.length; e++) {
                    d.visibiltyOnNextGrouping[e] = a("#" + a.jgrid.jqID(f.p.id) + "_" + a.jgrid.jqID(c[e])).is(":visible")
                }
                f.p.groupingView = a.extend(f.p.groupingView, b || {});
                d.groupField = c;
                a(f).trigger("reloadGrid")
            })
        },
        groupingRemove: function(b) {
            return this.each(function() {
                var e = this;
                if (b === undefined) {
                    b = true
                }
                e.p.grouping = false;
                if (b === true) {
                    var c = e.p.groupingView,
                    d;
                    for (d = 0; d < c.groupField.length; d++) {
                        if (!c.groupColumnShow[d] && c.visibiltyOnNextGrouping[d]) {
                            a(e).jqGrid("showCol", c.groupField)
                        }
                    }
                    a("tr.jqgroup, tr.jqfoot", "#" + a.jgrid.jqID(e.p.id) + " tbody:first").remove();
                    a("tr.jqgrow:hidden", "#" + a.jgrid.jqID(e.p.id) + " tbody:first").show()
                } else {
                    a(e).trigger("reloadGrid")
                }
            })
        },
        groupingCalculations: {
            handler: function(f, i, g, j, h, b) {
                var c = {
                    sum: function() {
                        return parseFloat(i || 0) + parseFloat((b[g] || 0))
                    },
                    min: function() {
                        if (i === "") {
                            return parseFloat(b[g] || 0)
                        }
                        return Math.min(parseFloat(i), parseFloat(b[g] || 0))
                    },
                    max: function() {
                        if (i === "") {
                            return parseFloat(b[g] || 0)
                        }
                        return Math.max(parseFloat(i), parseFloat(b[g] || 0))
                    },
                    count: function() {
                        if (i === "") {
                            i = 0
                        }
                        if (b.hasOwnProperty(g)) {
                            return i + 1
                        }
                        return 0
                    },
                    avg: function() {
                        return c.sum()
                    }
                };
                if (!c[f]) {
                    throw ("jqGrid Grouping No such method: " + f)
                }
                var e = c[f]();
                if (j != null) {
                    if (h === "fixed") {
                        e = e.toFixed(j)
                    } else {
                        var d = Math.pow(10, j);
                        e = Math.round(e * d) / d
                    }
                }
                return e
            }
        }
    })
})(jQuery); (function(a) {
    a.jgrid.extend({
        jqGridImport: function(b) {
            b = a.extend({
                imptype: "xml",
                impstring: "",
                impurl: "",
                mtype: "GET",
                impData: {},
                xmlGrid: {
                    config: "roots>grid",
                    data: "roots>rows"
                },
                jsonGrid: {
                    config: "grid",
                    data: "data"
                },
                ajaxOptions: {}
            },
            b || {});
            return this.each(function() {
                var f = this;
                var c = function(h, m) {
                    var g = a(m.xmlGrid.config, h)[0];
                    var l = a(m.xmlGrid.data, h)[0],
                    n,
                    j,
                    i;
                    if (xmlJsonClass.xml2json && a.jgrid.parse) {
                        n = xmlJsonClass.xml2json(g, " ");
                        n = a.jgrid.parse(n);
                        for (i in n) {
                            if (n.hasOwnProperty(i)) {
                                j = n[i]
                            }
                        }
                        if (l) {
                            var k = n.grid.datatype;
                            n.grid.datatype = "xmlstring";
                            n.grid.datastr = h;
                            a(f).jqGrid(j).jqGrid("setGridParam", {
                                datatype: k
                            })
                        } else {
                            a(f).jqGrid(j)
                        }
                        n = null;
                        j = null
                    } else {
                        alert("xml2json or parse are not present")
                    }
                };
                var e = function(i, l) {
                    if (i && typeof i === "string") {
                        var g = false;
                        if (a.jgrid.useJSON) {
                            a.jgrid.useJSON = false;
                            g = true
                        }
                        var h = a.jgrid.parse(i);
                        if (g) {
                            a.jgrid.useJSON = true
                        }
                        var m = h[l.jsonGrid.config];
                        var j = h[l.jsonGrid.data];
                        if (j) {
                            var k = m.datatype;
                            m.datatype = "jsonstring";
                            m.datastr = j;
                            a(f).jqGrid(m).jqGrid("setGridParam", {
                                datatype: k
                            })
                        } else {
                            a(f).jqGrid(m)
                        }
                    }
                };
                switch (b.imptype) {
                case "xml":
                    a.ajax(a.extend({
                        url:
                        b.impurl,
                        type: b.mtype,
                        data: b.impData,
                        dataType: "xml",
                        complete: function(g, h) {
                            if (h === "success") {
                                c(g.responseXML, b);
                                a(f).triggerHandler("jqGridImportComplete", [g, b]);
                                if (a.isFunction(b.importComplete)) {
                                    b.importComplete(g)
                                }
                            }
                            g = null
                        }
                    },
                    b.ajaxOptions));
                    break;
                case "xmlstring":
                    if (b.impstring && typeof b.impstring === "string") {
                        var d = a.parseXML(b.impstring);
                        if (d) {
                            c(d, b);
                            a(f).triggerHandler("jqGridImportComplete", [d, b]);
                            if (a.isFunction(b.importComplete)) {
                                b.importComplete(d)
                            }
                            b.impstring = null
                        }
                        d = null
                    }
                    break;
                case "json":
                    a.ajax(a.extend({
                        url:
                        b.impurl,
                        type: b.mtype,
                        data: b.impData,
                        dataType: "json",
                        complete: function(h) {
                            try {
                                e(h.responseText, b);
                                a(f).triggerHandler("jqGridImportComplete", [h, b]);
                                if (a.isFunction(b.importComplete)) {
                                    b.importComplete(h)
                                }
                            } catch(g) {}
                            h = null
                        }
                    },
                    b.ajaxOptions));
                    break;
                case "jsonstring":
                    if (b.impstring && typeof b.impstring === "string") {
                        e(b.impstring, b);
                        a(f).triggerHandler("jqGridImportComplete", [b.impstring, b]);
                        if (a.isFunction(b.importComplete)) {
                            b.importComplete(b.impstring)
                        }
                        b.impstring = null
                    }
                    break
                }
            })
        },
        jqGridExport: function(c) {
            c = a.extend({
                exptype: "xmlstring",
                root: "grid",
                ident: "\t"
            },
            c || {});
            var b = null;
            this.each(function() {
                if (!this.grid) {
                    return
                }
                var d, e = a.extend(true, {},
                a(this).jqGrid("getGridParam"));
                if (e.rownumbers) {
                    e.colNames.splice(0, 1);
                    e.colModel.splice(0, 1)
                }
                if (e.multiselect) {
                    e.colNames.splice(0, 1);
                    e.colModel.splice(0, 1)
                }
                if (e.subGrid) {
                    e.colNames.splice(0, 1);
                    e.colModel.splice(0, 1)
                }
                e.knv = null;
                if (e.treeGrid) {
                    for (d in e.treeReader) {
                        if (e.treeReader.hasOwnProperty(d)) {
                            e.colNames.splice(e.colNames.length - 1);
                            e.colModel.splice(e.colModel.length - 1)
                        }
                    }
                }
                switch (c.exptype) {
                case "xmlstring":
                    b = "<" + c.root + ">" + xmlJsonClass.json2xml(e, c.ident) + "</" + c.root + ">";
                    break;
                case "jsonstring":
                    b = "{" + xmlJsonClass.toJson(e, c.root, c.ident, false) + "}";
                    if (e.postData.filters !== undefined) {
                        b = b.replace(/filters":"/, 'filters":');
                        b = b.replace(/}]}"/, "}]}")
                    }
                    break
                }
            });
            return b
        },
        excelExport: function(b) {
            b = a.extend({
                exptype: "remote",
                url: null,
                oper: "oper",
                tag: "excel",
                exportOptions: {}
            },
            b || {});
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var c;
                if (b.exptype === "remote") {
                    var d = a.extend({},
                    this.p.postData);
                    d[b.oper] = b.tag;
                    var e = jQuery.param(d);
                    if (b.url.indexOf("?") !== -1) {
                        c = b.url + "&" + e
                    } else {
                        c = b.url + "?" + e
                    }
                    window.location = c
                }
            })
        }
    })
})(jQuery); (function(a) {
    a.jgrid.inlineEdit = a.jgrid.inlineEdit || {};
    a.jgrid.extend({
        editRow: function(c, l, k, f, b, g, e, h, i) {
            var d = {},
            j = a.makeArray(arguments).slice(1);
            if (a.type(j[0]) === "object") {
                d = j[0]
            } else {
                if (l !== undefined) {
                    d.keys = l
                }
                if (a.isFunction(k)) {
                    d.oneditfunc = k
                }
                if (a.isFunction(f)) {
                    d.successfunc = f
                }
                if (b !== undefined) {
                    d.url = b
                }
                if (g !== undefined) {
                    d.extraparam = g
                }
                if (a.isFunction(e)) {
                    d.aftersavefunc = e
                }
                if (a.isFunction(h)) {
                    d.errorfunc = h
                }
                if (a.isFunction(i)) {
                    d.afterrestorefunc = i
                }
            }
            d = a.extend(true, {
                keys: false,
                oneditfunc: null,
                successfunc: null,
                url: null,
                extraparam: {},
                aftersavefunc: null,
                errorfunc: null,
                afterrestorefunc: null,
                restoreAfterError: true,
                mtype: "POST",
                focusField: true
            },
            a.jgrid.inlineEdit, d);
            return this.each(function() {
                var p = this,
                v, q, n, o = 0,
                u = null,
                t = {},
                m, s, r;
                if (!p.grid) {
                    return
                }
                m = a(p).jqGrid("getInd", c, true);
                if (m === false) {
                    return
                }
                r = a.isFunction(d.beforeEditRow) ? d.beforeEditRow.call(p, d, c) : undefined;
                if (r === undefined) {
                    r = true
                }
                if (!r) {
                    return
                }
                n = a(m).attr("editable") || "0";
                if (n === "0" && !a(m).hasClass("not-editable-row")) {
                    s = p.p.colModel;
                    a('td[role="gridcell"]', m).each(function(z) {
                        v = s[z].name;
                        var y = p.p.treeGrid === true && v === p.p.ExpandColumn;
                        if (y) {
                            q = a("span:first", this).html()
                        } else {
                            try {
                                q = a.unformat.call(p, this, {
                                    rowId: c,
                                    colModel: s[z]
                                },
                                z)
                            } catch(w) {
                                q = (s[z].edittype && s[z].edittype === "textarea") ? a(this).text() : a(this).html()
                            }
                        }
                        if (v !== "cb" && v !== "subgrid" && v !== "rn") {
                            if (p.p.autoencode) {
                                q = a.jgrid.htmlDecode(q)
                            }
                            t[v] = q;
                            if (s[z].editable === true) {
                                if (u === null) {
                                    u = z
                                }
                                if (y) {
                                    a("span:first", this).html("")
                                } else {
                                    a(this).html("")
                                }
                                var x = a.extend({},
                                s[z].editoptions || {},
                                {
                                    id: c + "_" + v,
                                    name: v,
                                    rowId: c
                                });
                                if (!s[z].edittype) {
                                    s[z].edittype = "text"
                                }
                                if (q === "&nbsp;" || q === "&#160;" || (q.length === 1 && q.charCodeAt(0) === 160)) {
                                    q = ""
                                }
                                var A = a.jgrid.createEl.call(p, s[z].edittype, x, q, true, a.extend({},
                                a.jgrid.ajaxOptions, p.p.ajaxSelectOptions || {}));
                                a(A).addClass("editable");
                                a(this).css("overflow", "visible");
                                if (y) {
                                    a("span:first", this).append(A)
                                } else {
                                    a(this).append(A)
                                }
                                if (s[z].edittype == "checkbox" || (s[z].edittype == "select" && x.multiple)) {
                                    a(this).prepend('<input type="hidden" name="!' + x.name + '" value=""/>')
                                }
                                a.jgrid.bindEv.call(p, A, x);
                                if (s[z].edittype === "select" && s[z].editoptions !== undefined && s[z].editoptions.multiple === true && s[z].editoptions.dataUrl === undefined && a.jgrid.msie) {
                                    a(A).width(a(A).width())
                                }
                                o++
                            }
                        }
                    });
                    if (o > 0) {
                        t.id = c;
                        p.p.savedRow.push(t);
                        a(m).attr("editable", "1");
                        if (d.focusField) {
                            if (typeof d.focusField === "number" && parseInt(d.focusField, 10) <= s.length) {
                                u = d.focusField
                            }
                            setTimeout(function() {
                                var w = a("td:eq(" + u + ") :input:visible", m).not(":disabled");
                                if (w.length > 0) {
                                    if (w.eq(0).hasClass("select2-focusser")) {
                                        a(".select2-container:visible:not(:disabled)", m).select2("focus")
                                    } else {
                                        w.focus()
                                    }
                                }
                            },
                            0)
                        }
                        if (d.keys === true) {
                            a(m).bind("keydown",
                            function(A) {
                                if (A.keyCode === 27) {
                                    a(p).jqGrid("restoreRow", c, d.afterrestorefunc);
                                    if (p.p._inlinenav) {
                                        try {
                                            a(p).jqGrid("showAddEditButtons")
                                        } catch(D) {}
                                    }
                                    return false
                                }
                                if (A.keyCode === 13 && !A.shiftKey) {
                                    var z = A.target;
                                    var B = a(z).parents("tr").index();
                                    var E = a(z).parents("td").index();
                                    var w = false,
                                    y;
                                    for (var C = 0; C < 2; C++) {
                                        for (y = E + 1; y < p.p.colModel.length; y++) {
                                            if (p.p.colModel[y].editable === true && p.p.colModel[y].hidden !== true) {
                                                w = y;
                                                break
                                            }
                                        }
                                        if (w !== false) {
                                            var x = a("td:eq(" + w + ")", p.rows[B]);
                                            a("input:visible:not(:disabled), select:visible:not(:disabled), textarea:visible:not(:disabled)", x).focus();
                                            a(".select2-container:visible:not(:disabled)", x).select2("focus");
                                            break
                                        } else {
                                            if (p.rows.length - 1 == B) {
                                                if (p.p.editGridAddRow) {
                                                    p.p.editGridAddRow.call(p, "new")
                                                } else {
                                                    if (p.p.onSelectRow) {
                                                        p.p.onSelectRow.call(p, "new")
                                                    }
                                                }
                                            } else {
                                                a(p).jqGrid("setSelection", p.rows[++B].id, true, event);
                                                E = 0
                                            }
                                        }
                                    }
                                    return false
                                }
                            })
                        }
                        a(m).find("input, select, textarea").bind("focus",
                        function() {
                            a(p).jqGrid("setSelection", c, false)
                        });
                        a(p).triggerHandler("jqGridInlineEditRow", [c, d]);
                        if (a.isFunction(d.oneditfunc)) {
                            d.oneditfunc.call(p, c)
                        }
                    }
                }
            })
        },
        saveRow: function(p, l, h, j, u, s, c) {
            var f = a.makeArray(arguments).slice(1),
            D = {};
            if (a.type(f[0]) === "object") {
                D = f[0]
            } else {
                if (a.isFunction(l)) {
                    D.successfunc = l
                }
                if (h !== undefined) {
                    D.url = h
                }
                if (j !== undefined) {
                    D.extraparam = j
                }
                if (a.isFunction(u)) {
                    D.aftersavefunc = u
                }
                if (a.isFunction(s)) {
                    D.errorfunc = s
                }
                if (a.isFunction(c)) {
                    D.afterrestorefunc = c
                }
            }
            D = a.extend(true, {
                successfunc: null,
                url: null,
                extraparam: {},
                aftersavefunc: null,
                errorfunc: null,
                afterrestorefunc: null,
                restoreAfterError: true,
                mtype: "POST",
                saveui: "enable",
                savetext: a.jgrid.defaults.savetext || "Saving..."
            },
            a.jgrid.inlineEdit, D);
            var r = false;
            var I = this[0],
            d,
            K = {},
            C = {},
            B = {},
            E,
            n,
            g,
            x;
            if (!I.grid) {
                return r
            }
            x = a(I).jqGrid("getInd", p, true);
            if (x === false) {
                return r
            }
            var G = a.isFunction(D.beforeSaveRow) ? D.beforeSaveRow.call(I, D, p) : undefined;
            if (G === undefined) {
                G = true
            }
            if (!G) {
                return
            }
            E = a(x).attr("editable");
            D.url = D.url || I.p.editurl;
            if (E === "1") {
                var v;
                a('td[role="gridcell"]', x).each(function(o) {
                    v = I.p.colModel[o];
                    d = v.name;
                    if (d !== "cb" && d !== "subgrid" && v.editable === true && d !== "rn" && !a(this).hasClass("not-editable-cell")) {
                        switch (v.edittype) {
                        case "checkbox":
                            var k = ["Yes", "No"];
                            if (v.editoptions) {
                                k = v.editoptions.value.split(":")
                            }
                            K[d] = a("input", this).is(":checked") ? k[0] : k[1];
                            break;
                        case "text":
                        case "password":
                        case "textarea":
                        case "button":
                            K[d] = a("input, textarea", this).val();
                            break;
                        case "select":
                            if (!v.editoptions.multiple) {
                                K[d] = a("select option:selected", this).val();
                                C[d] = a("select option:selected", this).text()
                            } else {
                                var L = a("select", this),
                                N = [];
                                K[d] = a(L).val();
                                if (K[d]) {
                                    K[d] = K[d].join(",")
                                } else {
                                    K[d] = ""
                                }
                                a("select option:selected", this).each(function(e, O) {
                                    N[e] = a(O).text()
                                });
                                C[d] = N.join(",")
                            }
                            if (v.formatter && v.formatter === "select") {
                                C = {}
                            }
                            break;
                        case "custom":
                            try {
                                if (v.editoptions && a.isFunction(v.editoptions.custom_value)) {
                                    K[d] = v.editoptions.custom_value.call(I, a(".customelement", this), "get");
                                    if (K[d] === undefined) {
                                        throw "e2"
                                    }
                                } else {
                                    throw "e1"
                                }
                            } catch(M) {
                                if (M === "e1") {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_value' " + a.jgrid.edit.msg.nodefined, a.jgrid.edit.bClose)
                                }
                                if (M === "e2") {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, "function 'custom_value' " + a.jgrid.edit.msg.novalue, a.jgrid.edit.bClose)
                                } else {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, M.message, a.jgrid.edit.bClose)
                                }
                            }
                            break
                        }
                        g = a.jgrid.checkValues.call(I, K[d], o);
                        if (g[0] === false) {
                            return false
                        }
                        if (I.p.autoencode) {
                            K[d] = a.jgrid.htmlEncode(K[d])
                        }
                        if (D.url !== "clientArray" && v.editoptions && v.editoptions.NullIfEmpty === true) {
                            if (K[d] === "") {
                                B[d] = "null"
                            }
                        }
                    }
                    a(this).css("overflow", "hidden")
                });
                if (g[0] === false) {
                    try {
                        var b = a(I).jqGrid("getGridRowById", p),
                        t = a.jgrid.findPos(b);
                        a.jgrid.info_dialog(a.jgrid.errors.errcap, g[1], a.jgrid.edit.bClose, {
                            left: t[0],
                            top: t[1] + a(b).outerHeight()
                        })
                    } catch(J) {
                        alert(g[1])
                    }
                    return r
                }
                var z, w = I.p.prmNames,
                q = p;
                if (I.p.keyName === false) {
                    z = w.id
                } else {
                    z = I.p.keyName
                }
                if (K) {
                    K[w.oper] = w.editoper;
                    if (K[z] === undefined || K[z] === "") {
                        K[z] = p
                    } else {
                        if (x.id !== I.p.idPrefix + K[z]) {
                            var y = a.jgrid.stripPref(I.p.idPrefix, p);
                            if (I.p._index[y] !== undefined) {
                                I.p._index[K[z]] = I.p._index[y];
                                delete I.p._index[y]
                            }
                            p = I.p.idPrefix + K[z];
                            a(x).attr("id", p);
                            if (I.p.selrow === q) {
                                I.p.selrow = p
                            }
                            if (a.isArray(I.p.selarrrow)) {
                                var H = a.inArray(q, I.p.selarrrow);
                                if (H >= 0) {
                                    I.p.selarrrow[H] = p
                                }
                            }
                            if (I.p.multiselect) {
                                var m = "jqg_" + I.p.id + "_" + p;
                                a("input.cbox", x).attr("id", m).attr("name", m)
                            }
                        }
                    }
                    if (I.p.inlineData === undefined) {
                        I.p.inlineData = {}
                    }
                    K = a.extend({},
                    K, I.p.inlineData, D.extraparam)
                }
                if (D.url === "clientArray") {
                    K = a.extend({},
                    K, C);
                    if (I.p.autoencode) {
                        a.each(K,
                        function(i, e) {
                            K[i] = a.jgrid.htmlDecode(e)
                        })
                    }
                    var F, A = a(I).jqGrid("setRowData", p, K);
                    a(x).attr("editable", "0");
                    for (F = 0; F < I.p.savedRow.length; F++) {
                        if (String(I.p.savedRow[F].id) === String(q)) {
                            n = F;
                            break
                        }
                    }
                    if (n >= 0) {
                        I.p.savedRow.splice(n, 1)
                    }
                    a(I).triggerHandler("jqGridInlineAfterSaveRow", [p, A, K, D]);
                    if (a.isFunction(D.aftersavefunc)) {
                        D.aftersavefunc.call(I, p, A, K, D)
                    }
                    r = true;
                    a(x).removeClass("jqgrid-new-row").unbind("keydown")
                } else {
                    a(I).jqGrid("progressBar", {
                        method: "show",
                        loadtype: D.saveui,
                        htmlcontent: D.savetext
                    });
                    B = a.extend({},
                    K, B);
                    B[z] = a.jgrid.stripPref(I.p.idPrefix, B[z]);
                    a.ajax(a.extend({
                        url: D.url,
                        data: a.isFunction(I.p.serializeRowData) ? I.p.serializeRowData.call(I, B) : B,
                        type: D.mtype,
                        async: false,
                        complete: function(o, L) {
                            a(I).jqGrid("progressBar", {
                                method: "hide",
                                loadtype: D.saveui,
                                htmlcontent: D.savetext
                            });
                            if (L === "success") {
                                var i = true,
                                M, e;
                                M = a(I).triggerHandler("jqGridInlineSuccessSaveRow", [o, p, D]);
                                if (!a.isArray(M)) {
                                    M = [true, K]
                                }
                                if (M[0] && a.isFunction(D.successfunc)) {
                                    M = D.successfunc.call(I, o)
                                }
                                if (a.isArray(M)) {
                                    i = M[0];
                                    K = M[1] || K
                                } else {
                                    i = M
                                }
                                if (i === true) {
                                    if (I.p.autoencode) {
                                        a.each(K,
                                        function(N, k) {
                                            K[N] = a.jgrid.htmlDecode(k)
                                        })
                                    }
                                    K = a.extend({},
                                    K, C);
                                    a(I).jqGrid("setRowData", p, K);
                                    a(x).attr("editable", "0");
                                    for (e = 0; e < I.p.savedRow.length; e++) {
                                        if (String(I.p.savedRow[e].id) === String(p)) {
                                            n = e;
                                            break
                                        }
                                    }
                                    if (n >= 0) {
                                        I.p.savedRow.splice(n, 1)
                                    }
                                    a(I).triggerHandler("jqGridInlineAfterSaveRow", [p, o, K, D]);
                                    if (a.isFunction(D.aftersavefunc)) {
                                        D.aftersavefunc.call(I, p, o, K, D)
                                    }
                                    r = true;
                                    a(x).removeClass("jqgrid-new-row").unbind("keydown")
                                } else {
                                    a(I).triggerHandler("jqGridInlineErrorSaveRow", [p, o, L, null, D]);
                                    if (a.isFunction(D.errorfunc)) {
                                        D.errorfunc.call(I, p, o, L, null)
                                    }
                                    if (D.restoreAfterError === true) {
                                        a(I).jqGrid("restoreRow", p, D.afterrestorefunc)
                                    }
                                }
                            }
                        },
                        error: function(k, o, L) {
                            a("#lui_" + a.jgrid.jqID(I.p.id)).hide();
                            a(I).triggerHandler("jqGridInlineErrorSaveRow", [p, k, o, L, D]);
                            if (a.isFunction(D.errorfunc)) {
                                D.errorfunc.call(I, p, k, o, L)
                            } else {
                                var i = k.responseText || k.statusText;
                                try {
                                    a.jgrid.info_dialog(a.jgrid.errors.errcap, '<div class="ui-state-error">' + i + "</div>", a.jgrid.edit.bClose, {
                                        buttonalign: "right"
                                    })
                                } catch(M) {
                                    alert(i)
                                }
                            }
                            if (D.restoreAfterError === true) {
                                a(I).jqGrid("restoreRow", p, D.afterrestorefunc)
                            }
                        }
                    },
                    a.jgrid.ajaxOptions, I.p.ajaxRowOptions || {}))
                }
            }
            return r
        },
        restoreRow: function(d, b) {
            var c = a.makeArray(arguments).slice(1),
            e = {};
            if (a.type(c[0]) === "object") {
                e = c[0]
            } else {
                if (a.isFunction(b)) {
                    e.afterrestorefunc = b
                }
            }
            e = a.extend(true, {},
            a.jgrid.inlineEdit, e);
            return this.each(function() {
                var m = this,
                f = -1,
                h, l = {},
                g;
                if (!m.grid) {
                    return
                }
                h = a(m).jqGrid("getInd", d, true);
                if (h === false) {
                    return
                }
                var j = a.isFunction(e.beforeCancelRow) ? e.beforeCancelRow.call(m, e, d) : undefined;
                if (j === undefined) {
                    j = true
                }
                if (!j) {
                    return
                }
                for (g = 0; g < m.p.savedRow.length; g++) {
                    if (String(m.p.savedRow[g].id) === String(d)) {
                        f = g;
                        break
                    }
                }
                if (f >= 0) {
                    if (a.isFunction(a.fn.datepicker)) {
                        try {
                            a("input.hasDatepicker", "#" + a.jgrid.jqID(h.id)).datepicker("hide")
                        } catch(i) {}
                    }
                    a.each(m.p.colModel,
                    function() {
                        if (this.editable === true && m.p.savedRow[f].hasOwnProperty(this.name)) {
                            l[this.name] = m.p.savedRow[f][this.name]
                        }
                    });
                    a(m).jqGrid("setRowData", d, l);
                    a(h).attr("editable", "0").unbind("keydown");
                    m.p.savedRow.splice(f, 1);
                    if (a("#" + a.jgrid.jqID(d), "#" + a.jgrid.jqID(m.p.id)).hasClass("jqgrid-new-row")) {
                        setTimeout(function() {
                            a(m).jqGrid("delRowData", d);
                            a(m).jqGrid("showAddEditButtons")
                        },
                        0)
                    }
                }
                a(m).triggerHandler("jqGridInlineAfterRestoreRow", [d]);
                if (a.isFunction(e.afterrestorefunc)) {
                    e.afterrestorefunc.call(m, d)
                }
            })
        },
        addRow: function(b) {
            b = a.extend(true, {
                rowID: null,
                initdata: {},
                position: "first",
                src: null,
                useDefValues: true,
                useFormatter: false,
                addRowParams: {
                    extraparam: {}
                }
            },
            b || {});
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var f = this;
                var c = a.isFunction(b.beforeAddRow) ? b.beforeAddRow.call(f, b.addRowParams) : undefined;
                if (c === undefined) {
                    c = true
                }
                if (!c) {
                    return
                }
                b.rowID = a.isFunction(b.rowID) ? b.rowID.call(f, b) : ((b.rowID != null) ? b.rowID: a.jgrid.randId());
                if (b.useDefValues === true) {
                    a(f.p.colModel).each(function() {
                        if (this.editoptions && this.editoptions.defaultValue) {
                            var h = this.editoptions.defaultValue,
                            g = a.isFunction(h) ? h.call(f) : h;
                            b.initdata[this.name.replace("[", ".").replace(/\'/g, "").replace("]", "")] = g
                        }
                    })
                }
                a(f).jqGrid("addRowData", b.rowID, b.initdata, b.position, b.src);
                b.rowID = f.p.idPrefix + b.rowID;
                a("#" + a.jgrid.jqID(b.rowID), "#" + a.jgrid.jqID(f.p.id)).addClass("jqgrid-new-row");
                if (b.useFormatter) {
                    a("#" + a.jgrid.jqID(b.rowID) + " .ui-inline-edit", "#" + a.jgrid.jqID(f.p.id)).click()
                } else {
                    var d = f.p.prmNames,
                    e = d.oper;
                    b.addRowParams.extraparam[e] = d.addoper;
                    a(f).jqGrid("editRow", b.rowID, b.addRowParams);
                    a(f).jqGrid("setSelection", b.rowID)
                }
            })
        },
        inlineNav: function(b, c) {
            c = a.extend(true, {
                edit: true,
                editicon: "ui-icon-pencil",
                add: true,
                addicon: "ui-icon-plus",
                save: true,
                saveicon: "ui-icon-disk",
                cancel: true,
                cancelicon: "ui-icon-cancel",
                addParams: {
                    addRowParams: {
                        extraparam: {}
                    }
                },
                editParams: {},
                restoreAfterSelect: true
            },
            a.jgrid.nav, c || {});
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var k = this,
                e, h = a.jgrid.jqID(k.p.id);
                k.p._inlinenav = true;
                if (c.addParams.useFormatter === true) {
                    var d = k.p.colModel,
                    g;
                    for (g = 0; g < d.length; g++) {
                        if (d[g].formatter && d[g].formatter === "actions") {
                            if (d[g].formatoptions) {
                                var j = {
                                    keys: false,
                                    onEdit: null,
                                    onSuccess: null,
                                    afterSave: null,
                                    onError: null,
                                    afterRestore: null,
                                    extraparam: {},
                                    url: null
                                },
                                f = a.extend(j, d[g].formatoptions);
                                c.addParams.addRowParams = {
                                    keys: f.keys,
                                    oneditfunc: f.onEdit,
                                    successfunc: f.onSuccess,
                                    url: f.url,
                                    extraparam: f.extraparam,
                                    aftersavefunc: f.afterSave,
                                    errorfunc: f.onError,
                                    afterrestorefunc: f.afterRestore
                                }
                            }
                            break
                        }
                    }
                }
                if (c.add) {
                    a(k).jqGrid("navButtonAdd", b, {
                        caption: c.addtext,
                        title: c.addtitle,
                        buttonicon: c.addicon,
                        id: k.p.id + "_iladd",
                        onClickButton: function() {
                            a(k).jqGrid("addRow", c.addParams);
                            if (!c.addParams.useFormatter) {
                                a("#" + h + "_ilsave").removeClass("ui-state-disabled");
                                a("#" + h + "_ilcancel").removeClass("ui-state-disabled");
                                a("#" + h + "_iladd").addClass("ui-state-disabled");
                                a("#" + h + "_iledit").addClass("ui-state-disabled")
                            }
                        }
                    })
                }
                if (c.edit) {
                    a(k).jqGrid("navButtonAdd", b, {
                        caption: c.edittext,
                        title: c.edittitle,
                        buttonicon: c.editicon,
                        id: k.p.id + "_iledit",
                        onClickButton: function() {
                            var i = a(k).jqGrid("getGridParam", "selrow");
                            if (i) {
                                a(k).jqGrid("editRow", i, c.editParams);
                                a("#" + h + "_ilsave").removeClass("ui-state-disabled");
                                a("#" + h + "_ilcancel").removeClass("ui-state-disabled");
                                a("#" + h + "_iladd").addClass("ui-state-disabled");
                                a("#" + h + "_iledit").addClass("ui-state-disabled")
                            } else {
                                a.jgrid.viewModal("#alertmod", {
                                    gbox: "#gbox_" + h,
                                    jqm: true
                                });
                                a("#jqg_alrt").focus()
                            }
                        }
                    })
                }
                if (c.save) {
                    a(k).jqGrid("navButtonAdd", b, {
                        caption: c.savetext || "",
                        title: c.savetitle || "Save row",
                        buttonicon: c.saveicon,
                        id: k.p.id + "_ilsave",
                        onClickButton: function() {
                            var l = k.p.savedRow[0].id;
                            if (l) {
                                var i = k.p.prmNames,
                                n = i.oper,
                                m = c.editParams;
                                if (a("#" + a.jgrid.jqID(l), "#" + h).hasClass("jqgrid-new-row")) {
                                    c.addParams.addRowParams.extraparam[n] = i.addoper;
                                    m = c.addParams.addRowParams
                                } else {
                                    if (!c.editParams.extraparam) {
                                        c.editParams.extraparam = {}
                                    }
                                    c.editParams.extraparam[n] = i.editoper
                                }
                                if (a(k).jqGrid("saveRow", l, m)) {
                                    a(k).jqGrid("showAddEditButtons")
                                }
                            } else {
                                a.jgrid.viewModal("#alertmod", {
                                    gbox: "#gbox_" + h,
                                    jqm: true
                                });
                                a("#jqg_alrt").focus()
                            }
                        }
                    });
                    a("#" + h + "_ilsave").addClass("ui-state-disabled")
                }
                if (c.cancel) {
                    a(k).jqGrid("navButtonAdd", b, {
                        caption: c.canceltext || "",
                        title: c.canceltitle || "Cancel row editing",
                        buttonicon: c.cancelicon,
                        id: k.p.id + "_ilcancel",
                        onClickButton: function() {
                            var l = k.p.savedRow[0].id,
                            i = c.editParams;
                            if (l) {
                                if (a("#" + a.jgrid.jqID(l), "#" + h).hasClass("jqgrid-new-row")) {
                                    i = c.addParams.addRowParams
                                }
                                a(k).jqGrid("restoreRow", l, i);
                                a(k).jqGrid("showAddEditButtons")
                            } else {
                                a.jgrid.viewModal("#alertmod", {
                                    gbox: "#gbox_" + h,
                                    jqm: true
                                });
                                a("#jqg_alrt").focus()
                            }
                        }
                    });
                    a("#" + h + "_ilcancel").addClass("ui-state-disabled")
                }
                if (c.restoreAfterSelect === true) {
                    if (a.isFunction(k.p.beforeSelectRow)) {
                        e = k.p.beforeSelectRow
                    } else {
                        e = false
                    }
                    k.p.beforeSelectRow = function(m, l) {
                        var i = true;
                        if (k.p.savedRow.length > 0 && k.p._inlinenav === true && (m !== k.p.selrow && k.p.selrow !== null)) {
                            if (k.p.selrow === c.addParams.rowID) {
                                a(k).jqGrid("delRowData", k.p.selrow)
                            } else {
                                a(k).jqGrid("restoreRow", k.p.selrow, c.editParams)
                            }
                            a(k).jqGrid("showAddEditButtons")
                        }
                        if (e) {
                            i = e.call(k, m, l)
                        }
                        return i
                    }
                }
            })
        },
        showAddEditButtons: function() {
            return this.each(function() {
                if (!this.grid) {
                    return
                }
                var b = a.jgrid.jqID(this.p.id);
                a("#" + b + "_ilsave").addClass("ui-state-disabled");
                a("#" + b + "_ilcancel").addClass("ui-state-disabled");
                a("#" + b + "_iladd").removeClass("ui-state-disabled");
                a("#" + b + "_iledit").removeClass("ui-state-disabled")
            })
        }
    })
})(jQuery); (function($) {
    if ($.jgrid.msie && $.jgrid.msiever() === 8) {
        $.expr[":"].hidden = function(elem) {
            return elem.offsetWidth === 0 || elem.offsetHeight === 0 || elem.style.display === "none"
        }
    }
    $.jgrid._multiselect = false;
    if ($.ui) {
        if ($.ui.multiselect) {
            if ($.ui.multiselect.prototype._setSelected) {
                var setSelected = $.ui.multiselect.prototype._setSelected;
                $.ui.multiselect.prototype._setSelected = function(item, selected) {
                    var ret = setSelected.call(this, item, selected);
                    if (selected && this.selectedList) {
                        var elt = this.element;
                        this.selectedList.find("li").each(function() {
                            if ($(this).data("optionLink")) {
                                $(this).data("optionLink").remove().appendTo(elt)
                            }
                        })
                    }
                    return ret
                }
            }
            if ($.ui.multiselect.prototype.destroy) {
                $.ui.multiselect.prototype.destroy = function() {
                    this.element.show();
                    this.container.remove();
                    if ($.Widget === undefined) {
                        $.widget.prototype.destroy.apply(this, arguments)
                    } else {
                        $.Widget.prototype.destroy.apply(this, arguments)
                    }
                }
            }
            $.jgrid._multiselect = true
        }
    }
    $.jgrid.extend({
        sortableColumns: function(tblrow) {
            return this.each(function() {
                var ts = this,
                tid = $.jgrid.jqID(ts.p.id);
                function start() {
                    ts.p.disableClick = true
                }
                var sortable_opts = {
                    tolerance: "pointer",
                    axis: "x",
                    scrollSensitivity: "1",
                    items: ">th:not(:has(#jqgh_" + tid + "_cb,#jqgh_" + tid + "_rn,#jqgh_" + tid + "_subgrid),:hidden)",
                    placeholder: {
                        element: function(item) {
                            var el = $(document.createElement(item[0].nodeName)).addClass(item[0].className + " ui-sortable-placeholder ui-state-highlight").removeClass("ui-sortable-helper")[0];
                            return el
                        },
                        update: function(self, p) {
                            p.height(self.currentItem.innerHeight() - parseInt(self.currentItem.css("paddingTop") || 0, 10) - parseInt(self.currentItem.css("paddingBottom") || 0, 10));
                            p.width(self.currentItem.innerWidth() - parseInt(self.currentItem.css("paddingLeft") || 0, 10) - parseInt(self.currentItem.css("paddingRight") || 0, 10))
                        }
                    },
                    update: function(event, ui) {
                        var p = $(ui.item).parent(),
                        th = $(">th", p),
                        colModel = ts.p.colModel,
                        cmMap = {},
                        tid = ts.p.id + "_";
                        $.each(colModel,
                        function(i) {
                            cmMap[this.name] = i
                        });
                        var permutation = [];
                        th.each(function() {
                            var id = $(">div", this).get(0).id.replace(/^jqgh_/, "").replace(tid, "");
                            if (cmMap.hasOwnProperty(id)) {
                                permutation.push(cmMap[id])
                            }
                        });
                        $(ts).jqGrid("remapColumns", permutation, true, true);
                        if ($.isFunction(ts.p.sortable.update)) {
                            ts.p.sortable.update(permutation)
                        }
                        setTimeout(function() {
                            ts.p.disableClick = false
                        },
                        50)
                    }
                };
                if (ts.p.sortable.options) {
                    $.extend(sortable_opts, ts.p.sortable.options)
                } else {
                    if ($.isFunction(ts.p.sortable)) {
                        ts.p.sortable = {
                            update: ts.p.sortable
                        }
                    }
                }
                if (sortable_opts.start) {
                    var s = sortable_opts.start;
                    sortable_opts.start = function(e, ui) {
                        start();
                        s.call(this, e, ui)
                    }
                } else {
                    sortable_opts.start = start
                }
                if (ts.p.sortable.exclude) {
                    sortable_opts.items += ":not(" + ts.p.sortable.exclude + ")"
                }
                var $e = tblrow.sortable(sortable_opts),
                dataObj = $e.data("sortable") || $e.data("uiSortable");
                if (dataObj != null) {
                    dataObj.data("sortable").floating = true
                }
            })
        },
        columnChooser: function(opts) {
            var self = this,
            selector, select, colMap = {},
            fixedCols = [],
            dopts,
            mopts,
            $dialogContent,
            multiselectData,
            listHeight,
            colModel = self.jqGrid("getGridParam", "colModel"),
            colNames = self.jqGrid("getGridParam", "colNames"),
            getMultiselectWidgetData = function($elem) {
                return ($.ui.multiselect.prototype && $elem.data($.ui.multiselect.prototype.widgetFullName || $.ui.multiselect.prototype.widgetName)) || $elem.data("ui-multiselect") || $elem.data("multiselect")
            };
            if ($("#colchooser_" + $.jgrid.jqID(self[0].p.id)).length) {
                return
            }
            selector = $('<div id="colchooser_' + self[0].p.id + '" style="position:relative;overflow:hidden"><div><select multiple="multiple"></select></div></div>');
            select = $("select", selector);
            function insert(perm, i, v) {
                var a, b;
                if (i >= 0) {
                    a = perm.slice();
                    b = a.splice(i, Math.max(perm.length - i, i));
                    if (i > perm.length) {
                        i = perm.length
                    }
                    a[i] = v;
                    return a.concat(b)
                }
                return perm
            }
            function call(fn, obj) {
                if (!fn) {
                    return
                }
                if (typeof fn === "string") {
                    if ($.fn[fn]) {
                        $.fn[fn].apply(obj, $.makeArray(arguments).slice(2))
                    }
                } else {
                    if ($.isFunction(fn)) {
                        fn.apply(obj, $.makeArray(arguments).slice(2))
                    }
                }
            }
            opts = $.extend({
                width: 400,
                height: 240,
                classname: null,
                done: function(perm) {
                    if (perm) {
                        self.jqGrid("remapColumns", perm, true)
                    }
                },
                msel: "multiselect",
                dlog: "dialog",
                dialog_opts: {
                    minWidth: 470,
                    dialogClass: "ui-jqdialog"
                },
                dlog_opts: function(options) {
                    var buttons = {};
                    buttons[options.bSubmit] = function() {
                        options.apply_perm();
                        options.cleanup(false)
                    };
                    buttons[options.bCancel] = function() {
                        options.cleanup(true)
                    };
                    return $.extend(true, {
                        buttons: buttons,
                        close: function() {
                            options.cleanup(true)
                        },
                        modal: options.modal || false,
                        resizable: options.resizable || true,
                        width: options.width + 70,
                        resize: function() {
                            var widgetData = getMultiselectWidgetData(select),
                            $thisDialogContent = widgetData.container.closest(".ui-dialog-content");
                            if ($thisDialogContent.length > 0 && typeof $thisDialogContent[0].style === "object") {
                                $thisDialogContent[0].style.width = ""
                            } else {
                                $thisDialogContent.css("width", "")
                            }
                            widgetData.selectedList.height(Math.max(widgetData.selectedContainer.height() - widgetData.selectedActions.outerHeight() - 1, 1));
                            widgetData.availableList.height(Math.max(widgetData.availableContainer.height() - widgetData.availableActions.outerHeight() - 1, 1))
                        }
                    },
                    options.dialog_opts || {})
                },
                apply_perm: function() {
                    var perm = [];
                    $("option", select).each(function() {
                        if ($(this).is("[selected]")) {
                            self.jqGrid("showCol", colModel[this.value].name)
                        } else {
                            self.jqGrid("hideCol", colModel[this.value].name)
                        }
                    });
                    $("option[selected]", select).each(function() {
                        perm.push(parseInt(this.value, 10))
                    });
                    $.each(perm,
                    function() {
                        delete colMap[colModel[parseInt(this, 10)].name]
                    });
                    $.each(colMap,
                    function() {
                        var ti = parseInt(this, 10);
                        perm = insert(perm, ti, ti)
                    });
                    if (opts.done) {
                        opts.done.call(self, perm)
                    }
                    self.jqGrid("setGridWidth", self[0].p.tblwidth, self[0].p.shrinkToFit)
                },
                cleanup: function(calldone) {
                    call(opts.dlog, selector, "destroy");
                    call(opts.msel, select, "destroy");
                    selector.remove();
                    if (calldone && opts.done) {
                        opts.done.call(self)
                    }
                },
                msel_opts: {}
            },
            $.jgrid.col, opts || {});
            if ($.ui) {
                if ($.ui.multiselect && $.ui.multiselect.defaults) {
                    if (!$.jgrid._multiselect) {
                        alert("Multiselect plugin loaded after jqGrid. Please load the plugin before the jqGrid!");
                        return
                    }
                    opts.msel_opts = $.extend($.ui.multiselect.defaults, opts.msel_opts)
                }
            }
            if (opts.caption) {
                selector.attr("title", opts.caption)
            }
            if (opts.classname) {
                selector.addClass(opts.classname);
                select.addClass(opts.classname)
            }
            if (opts.width) {
                $(">div", selector).css({
                    width: opts.width,
                    margin: "0 auto"
                });
                select.css("width", opts.width)
            }
            if (opts.height) {
                $(">div", selector).css("height", opts.height);
                select.css("height", opts.height - 10)
            }
            select.empty();
            $.each(colModel,
            function(i) {
                colMap[this.name] = i;
                if (this.hidedlg) {
                    if (!this.hidden) {
                        fixedCols.push(i)
                    }
                    return
                }
                select.append("<option value='" + i + "' " + (this.hidden ? "": "selected='selected'") + ">" + $.jgrid.stripHtml(colNames[i]) + "</option>")
            });
            dopts = $.isFunction(opts.dlog_opts) ? opts.dlog_opts.call(self, opts) : opts.dlog_opts;
            call(opts.dlog, selector, dopts);
            mopts = $.isFunction(opts.msel_opts) ? opts.msel_opts.call(self, opts) : opts.msel_opts;
            call(opts.msel, select, mopts);
            $dialogContent = $("#colchooser_" + $.jgrid.jqID(self[0].p.id));
            $dialogContent.css({
                margin: "auto"
            });
            $dialogContent.find(">div").css({
                width: "100%",
                height: "100%",
                margin: "auto"
            });
            multiselectData = getMultiselectWidgetData(select);
            multiselectData.container.css({
                width: "100%",
                height: "100%",
                margin: "auto"
            });
            multiselectData.selectedContainer.css({
                width: multiselectData.options.dividerLocation * 100 + "%",
                height: "100%",
                margin: "auto",
                boxSizing: "border-box"
            });
            multiselectData.availableContainer.css({
                width: (100 - multiselectData.options.dividerLocation * 100) + "%",
                height: "100%",
                margin: "auto",
                boxSizing: "border-box"
            });
            multiselectData.selectedList.css("height", "auto");
            multiselectData.availableList.css("height", "auto");
            listHeight = Math.max(multiselectData.selectedList.height(), multiselectData.availableList.height());
            listHeight = Math.min(listHeight, $(window).height());
            multiselectData.selectedList.css("height", listHeight);
            multiselectData.availableList.css("height", listHeight)
        },
        sortableRows: function(opts) {
            return this.each(function() {
                var $t = this;
                if (!$t.grid) {
                    return
                }
                if ($t.p.treeGrid) {
                    return
                }
                if ($.fn.sortable) {
                    opts = $.extend({
                        cursor: "move",
                        axis: "y",
                        items: ".jqgrow"
                    },
                    opts || {});
                    if (opts.start && $.isFunction(opts.start)) {
                        opts._start_ = opts.start;
                        delete opts.start
                    } else {
                        opts._start_ = false
                    }
                    if (opts.update && $.isFunction(opts.update)) {
                        opts._update_ = opts.update;
                        delete opts.update
                    } else {
                        opts._update_ = false
                    }
                    opts.start = function(ev, ui) {
                        $(ui.item).css("border-width", "0");
                        $("td", ui.item).each(function(i) {
                            this.style.width = $t.grid.cols[i].style.width
                        });
                        if ($t.p.subGrid) {
                            var subgid = $(ui.item).attr("id");
                            try {
                                $($t).jqGrid("collapseSubGridRow", subgid)
                            } catch(e) {}
                        }
                        if (opts._start_) {
                            opts._start_.apply(this, [ev, ui])
                        }
                    };
                    opts.update = function(ev, ui) {
                        $(ui.item).css("border-width", "");
                        if ($t.p.rownumbers === true) {
                            $("td.jqgrid-rownum", $t.rows).each(function(i) {
                                $(this).html(i + 1 + (parseInt($t.p.page, 10) - 1) * parseInt($t.p.rowNum, 10))
                            })
                        }
                        if (opts._update_) {
                            opts._update_.apply(this, [ev, ui])
                        }
                    };
                    $("tbody:first", $t).sortable(opts);
                    $("tbody:first", $t).disableSelection()
                }
            })
        },
        gridDnD: function(opts) {
            return this.each(function() {
                var $t = this,
                i, cn;
                if (!$t.grid) {
                    return
                }
                if ($t.p.treeGrid) {
                    return
                }
                if (!$.fn.draggable || !$.fn.droppable) {
                    return
                }
                function updateDnD() {
                    var datadnd = $.data($t, "dnd");
                    $("tr.jqgrow:not(.ui-draggable)", $t).draggable($.isFunction(datadnd.drag) ? datadnd.drag.call($($t), datadnd) : datadnd.drag)
                }
                var appender = "<table id='jqgrid_dnd' class='ui-jqgrid-dnd'></table>";
                if ($("#jqgrid_dnd")[0] === undefined) {
                    $("body").append(appender)
                }
                if (typeof opts === "string" && opts === "updateDnD" && $t.p.jqgdnd === true) {
                    updateDnD();
                    return
                }
                opts = $.extend({
                    drag: function(opts) {
                        return $.extend({
                            start: function(ev, ui) {
                                var i, subgid;
                                if ($t.p.subGrid) {
                                    subgid = $(ui.helper).attr("id");
                                    try {
                                        $($t).jqGrid("collapseSubGridRow", subgid)
                                    } catch(e) {}
                                }
                                for (i = 0; i < $.data($t, "dnd").connectWith.length; i++) {
                                    if ($($.data($t, "dnd").connectWith[i]).jqGrid("getGridParam", "reccount") === 0) {
                                        $($.data($t, "dnd").connectWith[i]).jqGrid("addRowData", "jqg_empty_row", {})
                                    }
                                }
                                ui.helper.addClass("ui-state-highlight");
                                $("td", ui.helper).each(function(i) {
                                    this.style.width = $t.grid.headers[i].width + "px"
                                });
                                if (opts.onstart && $.isFunction(opts.onstart)) {
                                    opts.onstart.call($($t), ev, ui)
                                }
                            },
                            stop: function(ev, ui) {
                                var i, ids;
                                if (ui.helper.dropped && !opts.dragcopy) {
                                    ids = $(ui.helper).attr("id");
                                    if (ids === undefined) {
                                        ids = $(this).attr("id")
                                    }
                                    $($t).jqGrid("delRowData", ids)
                                }
                                for (i = 0; i < $.data($t, "dnd").connectWith.length; i++) {
                                    $($.data($t, "dnd").connectWith[i]).jqGrid("delRowData", "jqg_empty_row")
                                }
                                if (opts.onstop && $.isFunction(opts.onstop)) {
                                    opts.onstop.call($($t), ev, ui)
                                }
                            }
                        },
                        opts.drag_opts || {})
                    },
                    drop: function(opts) {
                        return $.extend({
                            accept: function(d) {
                                if (!$(d).hasClass("jqgrow")) {
                                    return d
                                }
                                var tid = $(d).closest("table.ui-jqgrid-btable");
                                if (tid.length > 0 && $.data(tid[0], "dnd") !== undefined) {
                                    var cn = $.data(tid[0], "dnd").connectWith;
                                    return $.inArray("#" + $.jgrid.jqID(this.id), cn) !== -1 ? true: false
                                }
                                return false
                            },
                            drop: function(ev, ui) {
                                if (!$(ui.draggable).hasClass("jqgrow")) {
                                    return
                                }
                                var accept = $(ui.draggable).attr("id");
                                var getdata = ui.draggable.parent().parent().jqGrid("getRowData", accept);
                                if (!opts.dropbyname) {
                                    var j = 0,
                                    tmpdata = {},
                                    nm, key;
                                    var dropmodel = $("#" + $.jgrid.jqID(this.id)).jqGrid("getGridParam", "colModel");
                                    try {
                                        for (key in getdata) {
                                            if (getdata.hasOwnProperty(key)) {
                                                nm = dropmodel[j].name;
                                                if (! (nm === "cb" || nm === "rn" || nm === "subgrid")) {
                                                    if (getdata.hasOwnProperty(key) && dropmodel[j]) {
                                                        tmpdata[nm] = getdata[key]
                                                    }
                                                }
                                                j++
                                            }
                                        }
                                        getdata = tmpdata
                                    } catch(e) {}
                                }
                                ui.helper.dropped = true;
                                if (opts.beforedrop && $.isFunction(opts.beforedrop)) {
                                    var datatoinsert = opts.beforedrop.call(this, ev, ui, getdata, $("#" + $.jgrid.jqID($t.p.id)), $(this));
                                    if (datatoinsert !== undefined && datatoinsert !== null && typeof datatoinsert === "object") {
                                        getdata = datatoinsert
                                    }
                                }
                                if (ui.helper.dropped) {
                                    var grid;
                                    if (opts.autoid) {
                                        if ($.isFunction(opts.autoid)) {
                                            grid = opts.autoid.call(this, getdata)
                                        } else {
                                            grid = Math.ceil(Math.random() * 1000);
                                            grid = opts.autoidprefix + grid
                                        }
                                    }
                                    $("#" + $.jgrid.jqID(this.id)).jqGrid("addRowData", grid, getdata, opts.droppos)
                                }
                                if (opts.ondrop && $.isFunction(opts.ondrop)) {
                                    opts.ondrop.call(this, ev, ui, getdata)
                                }
                            }
                        },
                        opts.drop_opts || {})
                    },
                    onstart: null,
                    onstop: null,
                    beforedrop: null,
                    ondrop: null,
                    drop_opts: {
                        activeClass: "ui-state-active",
                        hoverClass: "ui-state-hover"
                    },
                    drag_opts: {
                        revert: "invalid",
                        helper: "clone",
                        cursor: "move",
                        appendTo: "#jqgrid_dnd",
                        zIndex: 5000
                    },
                    dragcopy: false,
                    dropbyname: false,
                    droppos: "first",
                    autoid: true,
                    autoidprefix: "dnd_"
                },
                opts || {});
                if (!opts.connectWith) {
                    return
                }
                opts.connectWith = opts.connectWith.split(",");
                opts.connectWith = $.map(opts.connectWith,
                function(n) {
                    return $.trim(n)
                });
                $.data($t, "dnd", opts);
                if ($t.p.reccount !== 0 && !$t.p.jqgdnd) {
                    updateDnD()
                }
                $t.p.jqgdnd = true;
                for (i = 0; i < opts.connectWith.length; i++) {
                    cn = opts.connectWith[i];
                    $(cn).droppable($.isFunction(opts.drop) ? opts.drop.call($($t), opts) : opts.drop)
                }
            })
        },
        gridResize: function(opts) {
            return this.each(function() {
                var $t = this,
                gID = $.jgrid.jqID($t.p.id);
                if (!$t.grid || !$.fn.resizable) {
                    return
                }
                opts = $.extend({},
                opts || {});
                if (opts.alsoResize) {
                    opts._alsoResize_ = opts.alsoResize;
                    delete opts.alsoResize
                } else {
                    opts._alsoResize_ = false
                }
                if (opts.stop && $.isFunction(opts.stop)) {
                    opts._stop_ = opts.stop;
                    delete opts.stop
                } else {
                    opts._stop_ = false
                }
                opts.stop = function(ev, ui) {
                    $($t).jqGrid("setGridParam", {
                        height: $("#gview_" + gID + " .ui-jqgrid-bdiv").height()
                    });
                    $($t).jqGrid("setGridWidth", ui.size.width, opts.shrinkToFit);
                    if (opts._stop_) {
                        opts._stop_.call($t, ev, ui)
                    }
                };
                if (opts._alsoResize_) {
                    var optstest = "{'#gview_" + gID + " .ui-jqgrid-bdiv':true,'" + opts._alsoResize_ + "':true}";
                    opts.alsoResize = eval("(" + optstest + ")")
                } else {
                    opts.alsoResize = $(".ui-jqgrid-bdiv", "#gview_" + gID)
                }
                delete opts._alsoResize_;
                $("#gbox_" + gID).resizable(opts)
            })
        }
    })
})(jQuery); (function(b) {
    function a(f, e) {
        var d, h, c = [],
        g;
        if (!this || typeof f !== "function" || (f instanceof RegExp)) {
            throw new TypeError()
        }
        g = this.length;
        for (d = 0; d < g; d++) {
            if (this.hasOwnProperty(d)) {
                h = this[d];
                if (f.call(e, h, d, this)) {
                    c.push(h);
                    break
                }
            }
        }
        return c
    }
    b.assocArraySize = function(e) {
        var d = 0,
        c;
        for (c in e) {
            if (e.hasOwnProperty(c)) {
                d++
            }
        }
        return d
    };
    b.jgrid.extend({
        pivotSetup: function(h, l) {
            var f = [],
            j = [],
            k = [],
            g = [],
            i = [],
            c = {
                grouping: true,
                groupingView: {
                    groupField: [],
                    groupSummary: [],
                    groupSummaryPos: []
                }
            },
            e = [],
            d = b.extend({
                rowTotals: false,
                rowTotalsText: "Total",
                colTotals: false,
                groupSummary: true,
                groupSummaryPos: "header",
                frozenStaticCols: false
            },
            l || {});
            this.each(function() {
                var u, s, K, R = h.length,
                E, L, F, P, v, A = 0;
                function C(T, S, r) {
                    var U;
                    U = a.call(T, S, r);
                    return U.length > 0 ? U[0] : null
                }
                function t(V, T) {
                    var S = 0,
                    r = true,
                    U;
                    for (U in V) {
                        if (V[U] != this[S]) {
                            r = false;
                            break
                        }
                        S++;
                        if (S >= this.length) {
                            break
                        }
                    }
                    if (r) {
                        s = T
                    }
                    return r
                }
                function y(V, r, U, T) {
                    var S;
                    switch (V) {
                    case "sum":
                        S = parseFloat(r || 0) + parseFloat((T[U] || 0));
                        break;
                    case "count":
                        if (r === "" || r == null) {
                            r = 0
                        }
                        if (T.hasOwnProperty(U)) {
                            S = r + 1
                        } else {
                            S = 0
                        }
                        break;
                    case "min":
                        if (r === "" || r == null) {
                            S = parseFloat(T[U] || 0)
                        } else {
                            S = Math.min(parseFloat(r), parseFloat(T[U] || 0))
                        }
                        break;
                    case "max":
                        if (r === "" || r == null) {
                            S = parseFloat(T[U] || 0)
                        } else {
                            S = Math.max(parseFloat(r), parseFloat(T[U] || 0))
                        }
                        break
                    }
                    return S
                }
                function Q(ad, U, ab, ae) {
                    var S = U.length,
                    W, aa, V, ac, T = "",
                    X = [];
                    if (b.isArray(ab)) {
                        ac = ab.length;
                        X = ab
                    } else {
                        ac = 1;
                        X[0] = ab
                    }
                    g = [];
                    i = [];
                    g.root = 0;
                    for (V = 0; V < ac; V++) {
                        var Z = [],
                        r;
                        for (W = 0; W < S; W++) {
                            if (ab == null) {
                                aa = b.trim(U[W].member) + "_" + U[W].aggregator;
                                r = aa;
                                X[0] = r
                            } else {
                                r = ab[V].replace(/\s+/g, "");
                                try {
                                    aa = (S === 1 ? T + r: T + r + "_" + U[W].aggregator + "_" + String(W))
                                } catch(Y) {}
                            }
                            aa = !isNaN(parseInt(aa, 10)) ? aa + " ": aa;
                            ae[aa] = Z[aa] = y(U[W].aggregator, ae[aa], U[W].member, ad);
                            if (V <= 1 && r !== "_r_Totals" && T === "") {
                                T = r
                            }
                        }
                        g[aa] = Z;
                        i[aa] = X[V]
                    }
                    return ae
                }
                if (d.rowTotals && d.yDimension.length > 0) {
                    var H = d.yDimension[0].dataName;
                    d.yDimension.splice(0, 0, {
                        dataName: H
                    });
                    d.yDimension[0].converter = function() {
                        return "_r_Totals"
                    }
                }
                E = b.isArray(d.xDimension) ? d.xDimension.length: 0;
                L = d.yDimension.length;
                F = b.isArray(d.aggregates) ? d.aggregates.length: 0;
                if (E === 0 || F === 0) {
                    throw ("xDimension or aggregates optiona are not set!")
                }
                var M;
                for (K = 0; K < E; K++) {
                    M = {
                        name: d.xDimension[K].dataName,
                        frozen: d.frozenStaticCols
                    };
                    if (d.xDimension[K].isGroupField == null) {
                        d.xDimension[K].isGroupField = true
                    }
                    M = b.extend(true, M, d.xDimension[K]);
                    f.push(M)
                }
                var I = E - 1,
                z = {};
                while (A < R) {
                    u = h[A];
                    var G = [];
                    var N = [];
                    P = {};
                    K = 0;
                    do {
                        G[K] = b.trim(u[d.xDimension[K].dataName]);
                        P[d.xDimension[K].dataName] = G[K];
                        K++
                    } while ( K < E );
                    var J = 0;
                    s = -1;
                    v = C(j, t, G);
                    if (!v) {
                        J = 0;
                        if (L >= 1) {
                            for (J = 0; J < L; J++) {
                                N[J] = b.trim(u[d.yDimension[J].dataName]);
                                if (d.yDimension[J].converter && b.isFunction(d.yDimension[J].converter)) {
                                    N[J] = d.yDimension[J].converter.call(this, N[J], G, N)
                                }
                            }
                            P = Q(u, d.aggregates, N, P)
                        } else {
                            if (L === 0) {
                                P = Q(u, d.aggregates, null, P)
                            }
                        }
                        j.push(P)
                    } else {
                        if (s >= 0) {
                            J = 0;
                            if (L >= 1) {
                                for (J = 0; J < L; J++) {
                                    N[J] = b.trim(u[d.yDimension[J].dataName]);
                                    if (d.yDimension[J].converter && b.isFunction(d.yDimension[J].converter)) {
                                        N[J] = d.yDimension[J].converter.call(this, N[J], G, N)
                                    }
                                }
                                v = Q(u, d.aggregates, N, v)
                            } else {
                                if (L === 0) {
                                    v = Q(u, d.aggregates, null, v)
                                }
                            }
                            j[s] = v
                        }
                    }
                    var q = 0,
                    D = null,
                    B = null,
                    p;
                    for (p in g) {
                        if (g.hasOwnProperty(p)) {
                            if (q === 0) {
                                if (!z.children || z.children === undefined) {
                                    z = {
                                        text: p,
                                        level: 0,
                                        children: [],
                                        label: p
                                    }
                                }
                                D = z.children
                            } else {
                                B = null;
                                for (K = 0; K < D.length; K++) {
                                    if (D[K].text === p) {
                                        B = D[K];
                                        break
                                    }
                                }
                                if (B) {
                                    D = B.children
                                } else {
                                    D.push({
                                        children: [],
                                        text: p,
                                        level: q,
                                        fields: g[p],
                                        label: i[p]
                                    });
                                    D = D[D.length - 1].children
                                }
                            }
                            q++
                        }
                    }
                    A++
                }
                var o = [],
                m = f.length,
                x = m;
                if (L > 0) {
                    e[L - 1] = {
                        useColSpanStyle: false,
                        groupHeaders: []
                    }
                }
                function O(Y) {
                    var V, X, aa, W, S;
                    for (aa in Y) {
                        if (Y.hasOwnProperty(aa)) {
                            if (typeof Y[aa] !== "object") {
                                if (aa === "level") {
                                    if (o[Y.level] === undefined) {
                                        o[Y.level] = "";
                                        if (Y.level > 0 && Y.text !== "_r_Totals") {
                                            e[Y.level - 1] = {
                                                useColSpanStyle: false,
                                                groupHeaders: []
                                            }
                                        }
                                    }
                                    if (o[Y.level] !== Y.text && Y.children.length && Y.text !== "_r_Totals") {
                                        if (Y.level > 0) {
                                            e[Y.level - 1].groupHeaders.push({
                                                titleText: Y.label,
                                                numberOfColumns: 0
                                            });
                                            var r = e[Y.level - 1].groupHeaders.length - 1,
                                            U = r === 0 ? x: m + F;
                                            if (Y.level - 1 === (d.rowTotals ? 1 : 0)) {
                                                if (r > 0) {
                                                    var T = e[Y.level - 1].groupHeaders[r - 1].numberOfColumns;
                                                    if (T) {
                                                        U = T + 1 + d.aggregates.length
                                                    }
                                                }
                                            }
                                            e[Y.level - 1].groupHeaders[r].startColumnName = f[U].name;
                                            e[Y.level - 1].groupHeaders[r].numberOfColumns = f.length - U;
                                            m = f.length
                                        }
                                    }
                                    o[Y.level] = Y.text
                                }
                                if (Y.level === L && aa === "level" && L > 0) {
                                    if (F > 1) {
                                        var Z = 1;
                                        for (V in Y.fields) {
                                            if (Z === 1) {
                                                e[L - 1].groupHeaders.push({
                                                    startColumnName: V,
                                                    numberOfColumns: 1,
                                                    titleText: Y.text
                                                })
                                            }
                                            Z++
                                        }
                                        e[L - 1].groupHeaders[e[L - 1].groupHeaders.length - 1].numberOfColumns = Z - 1
                                    } else {
                                        e.splice(L - 1, 1)
                                    }
                                }
                            }
                            if (Y[aa] != null && typeof Y[aa] === "object") {
                                O(Y[aa])
                            }
                            if (aa === "level") {
                                if (Y.level > 0) {
                                    X = 0;
                                    for (V in Y.fields) {
                                        if (Y.fields.hasOwnProperty(V)) {
                                            S = {};
                                            for (W in d.aggregates[X]) {
                                                if (d.aggregates[X].hasOwnProperty(W)) {
                                                    switch (W) {
                                                    case "member":
                                                    case "label":
                                                    case "aggregator":
                                                        break;
                                                    default:
                                                        S[W] = d.aggregates[X][W]
                                                    }
                                                }
                                            }
                                            if (F > 1) {
                                                S.name = V;
                                                S.label = d.aggregates[X].label || Y.label
                                            } else {
                                                S.name = Y.text;
                                                S.label = Y.text === "_r_Totals" ? d.rowTotalsText: Y.label
                                            }
                                            f.push(S);
                                            X++
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                O(z);
                var n;
                if (d.colTotals) {
                    var w = j.length;
                    while (w--) {
                        for (K = E; K < f.length; K++) {
                            n = f[K].name;
                            if (!k[n]) {
                                k[n] = parseFloat(j[w][n] || 0)
                            } else {
                                k[n] += parseFloat(j[w][n] || 0)
                            }
                        }
                    }
                }
                if (I > 0) {
                    for (K = 0; K < I; K++) {
                        if (f[K].isGroupField) {
                            c.groupingView.groupField.push(f[K].name);
                            c.groupingView.groupSummary.push(d.groupSummary);
                            c.groupingView.groupSummaryPos.push(d.groupSummaryPos)
                        }
                    }
                } else {
                    c.grouping = false
                }
                c.sortname = f[I].name;
                c.groupingView.hideFirstGroupCol = true
            });
            return {
                colModel: f,
                rows: j,
                groupOptions: c,
                groupHeaders: e,
                summary: k
            }
        },
        jqPivot: function(f, d, c, e) {
            return this.each(function() {
                var h = this;
                function g(n) {
                    var k = jQuery(h).jqGrid("pivotSetup", n, d),
                    o = b.assocArraySize(k.summary) > 0 ? true: false,
                    m = b.jgrid.from(k.rows),
                    l;
                    for (l = 0; l < k.groupOptions.groupingView.groupField.length; l++) {
                        m.orderBy(k.groupOptions.groupingView.groupField[l], "a", "text", "")
                    }
                    jQuery(h).jqGrid(b.extend(true, {
                        datastr: b.extend(m.select(), o ? {
                            userdata: k.summary
                        }: {}),
                        datatype: "jsonstring",
                        footerrow: o,
                        userDataOnFooter: o,
                        colModel: k.colModel,
                        viewrecords: true,
                        sortname: d.xDimension[0].dataName
                    },
                    k.groupOptions, c || {}));
                    var j = k.groupHeaders;
                    if (j.length) {
                        for (l = 0; l < j.length; l++) {
                            if (j[l] && j[l].groupHeaders.length) {
                                jQuery(h).jqGrid("setGroupHeaders", j[l])
                            }
                        }
                    }
                    if (d.frozenStaticCols) {
                        jQuery(h).jqGrid("setFrozenColumns")
                    }
                }
                if (typeof f === "string") {
                    b.ajax(b.extend({
                        url: f,
                        dataType: "json",
                        success: function(i) {
                            g(b.jgrid.getAccessor(i, e && e.reader ? e.reader: "rows"))
                        }
                    },
                    e || {}))
                } else {
                    g(f)
                }
            })
        }
    })
})(jQuery); (function(a) {
    a.jgrid.extend({
        setSubGrid: function() {
            return this.each(function() {
                var e = this,
                b, d, c = {
                    plusicon: "ui-icon-plus",
                    minusicon: "ui-icon-minus",
                    openicon: "ui-icon-carat-1-sw",
                    expandOnLoad: false,
                    delayOnLoad: 50,
                    selectOnExpand: false,
                    selectOnCollapse: false,
                    reloadOnExpand: true
                };
                e.p.subGridOptions = a.extend(c, e.p.subGridOptions || {});
                e.p.colNames.unshift("");
                e.p.colModel.unshift({
                    name: "subgrid",
                    width: a.jgrid.cell_width ? e.p.subGridWidth + e.p.cellLayout: e.p.subGridWidth,
                    sortable: false,
                    resizable: false,
                    hidedlg: true,
                    search: false,
                    fixed: true
                });
                b = e.p.subGridModel;
                if (b[0]) {
                    b[0].align = a.extend([], b[0].align || []);
                    for (d = 0; d < b[0].name.length; d++) {
                        b[0].align[d] = b[0].align[d] || "left"
                    }
                }
            })
        },
        addSubGridCell: function(f, e) {
            var d = "",
            b, c;
            this.each(function() {
                d = this.formatCol(f, e);
                c = this.p.id;
                b = this.p.subGridOptions.plusicon
            });
            return '<td role="gridcell" aria-describedby="' + c + '_subgrid" class="ui-sgcollapsed sgcollapsed" ' + d + "><a style='cursor:pointer;'><span class='ui-icon " + b + "'></span></a></td>"
        },
        addSubGrid: function(c, b) {
            return this.each(function() {
                var n = this;
                if (!n.grid) {
                    return
                }
                var f = function(r, i, t) {
                    var s = a("<td align='" + n.p.subGridModel[0].align[t] + "'></td>").html(i);
                    a(r).append(s)
                };
                var e = function(s, y) {
                    var x, v, u, w = a("<table cellspacing='0' cellpadding='0' border='0'><tbody></tbody></table>"),
                    r = a("<tr></tr>");
                    for (v = 0; v < n.p.subGridModel[0].name.length; v++) {
                        x = a("<th class='ui-state-default ui-th-subgrid ui-th-column ui-th-" + n.p.direction + "'></th>");
                        a(x).html(n.p.subGridModel[0].name[v]);
                        a(x).width(n.p.subGridModel[0].width[v]);
                        a(r).append(x)
                    }
                    a(w).append(r);
                    if (s) {
                        u = n.p.xmlReader.subgrid;
                        a(u.root + " " + u.row, s).each(function() {
                            r = a("<tr class='ui-widget-content ui-subtblcell'></tr>");
                            if (u.repeatitems === true) {
                                a(u.cell, this).each(function(z) {
                                    f(r, a(this).text() || "&#160;", z)
                                })
                            } else {
                                var i = n.p.subGridModel[0].mapping || n.p.subGridModel[0].name;
                                if (i) {
                                    for (v = 0; v < i.length; v++) {
                                        f(r, a(i[v], this).text() || "&#160;", v)
                                    }
                                }
                            }
                            a(w).append(r)
                        })
                    }
                    var t = a("table:first", n.grid.bDiv).attr("id") + "_";
                    a("#" + a.jgrid.jqID(t + y)).append(w);
                    n.grid.hDiv.loading = false;
                    a("#load_" + a.jgrid.jqID(n.p.id)).hide();
                    return false
                };
                var g = function(y, v) {
                    var A, C, w, z, r, u, t = a("<table cellspacing='0' cellpadding='0' border='0'><tbody></tbody></table>"),
                    s = a("<tr></tr>");
                    for (w = 0; w < n.p.subGridModel[0].name.length; w++) {
                        A = a("<th class='ui-state-default ui-th-subgrid ui-th-column ui-th-" + n.p.direction + "'></th>");
                        a(A).html(n.p.subGridModel[0].name[w]);
                        a(A).width(n.p.subGridModel[0].width[w]);
                        a(s).append(A)
                    }
                    a(t).append(s);
                    if (y) {
                        r = n.p.jsonReader.subgrid;
                        C = a.jgrid.getAccessor(y, r.root);
                        if (C !== undefined) {
                            for (w = 0; w < C.length; w++) {
                                z = C[w];
                                s = a("<tr class='ui-widget-content ui-subtblcell'></tr>");
                                if (r.repeatitems === true) {
                                    if (r.cell) {
                                        z = z[r.cell]
                                    }
                                    for (u = 0; u < z.length; u++) {
                                        f(s, z[u] || "&#160;", u)
                                    }
                                } else {
                                    var x = n.p.subGridModel[0].mapping || n.p.subGridModel[0].name;
                                    if (x.length) {
                                        for (u = 0; u < x.length; u++) {
                                            f(s, z[x[u]] || "&#160;", u)
                                        }
                                    }
                                }
                                a(t).append(s)
                            }
                        }
                    }
                    var B = a("table:first", n.grid.bDiv).attr("id") + "_";
                    a("#" + a.jgrid.jqID(B + v)).append(t);
                    n.grid.hDiv.loading = false;
                    a("#load_" + a.jgrid.jqID(n.p.id)).hide();
                    return false
                };
                var o = function(u) {
                    var r, v, t, s;
                    r = a(u).attr("id");
                    v = {
                        nd_: (new Date().getTime())
                    };
                    v[n.p.prmNames.subgridid] = r;
                    if (!n.p.subGridModel[0]) {
                        return false
                    }
                    if (n.p.subGridModel[0].params) {
                        for (s = 0; s < n.p.subGridModel[0].params.length; s++) {
                            for (t = 0; t < n.p.colModel.length; t++) {
                                if (n.p.colModel[t].name === n.p.subGridModel[0].params[s]) {
                                    v[n.p.colModel[t].name] = a("td:eq(" + t + ")", u).text().replace(/\&#160\;/ig, "")
                                }
                            }
                        }
                    }
                    if (!n.grid.hDiv.loading) {
                        n.grid.hDiv.loading = true;
                        a("#load_" + a.jgrid.jqID(n.p.id)).show();
                        if (!n.p.subgridtype) {
                            n.p.subgridtype = n.p.datatype
                        }
                        if (a.isFunction(n.p.subgridtype)) {
                            n.p.subgridtype.call(n, v)
                        } else {
                            n.p.subgridtype = n.p.subgridtype.toLowerCase()
                        }
                        switch (n.p.subgridtype) {
                        case "xml":
                        case "json":
                            a.ajax(a.extend({
                                type:
                                n.p.mtype,
                                url: a.isFunction(n.p.subGridUrl) ? n.p.subGridUrl.call(n, v) : n.p.subGridUrl,
                                dataType: n.p.subgridtype,
                                data: a.isFunction(n.p.serializeSubGridData) ? n.p.serializeSubGridData.call(n, v) : v,
                                complete: function(i) {
                                    if (n.p.subgridtype === "xml") {
                                        e(i.responseXML, r)
                                    } else {
                                        g(a.jgrid.parse(i.responseText), r)
                                    }
                                    i = null
                                }
                            },
                            a.jgrid.ajaxOptions, n.p.ajaxSubgridOptions || {}));
                            break
                        }
                    }
                    return false
                };
                var p, q, j, l = 0,
                h, d;
                a.each(n.p.colModel,
                function() {
                    if (this.hidden === true || this.name === "rn" || this.name === "cb") {
                        l++
                    }
                });
                var m = n.rows.length,
                k = 1;
                if (b !== undefined && b > 0) {
                    k = b;
                    m = b + 1
                }
                while (k < m) {
                    if (a(n.rows[k]).hasClass("jqgrow")) {
                        if (n.p.scroll) {
                            a(n.rows[k].cells[c]).unbind("click")
                        }
                        a(n.rows[k].cells[c]).bind("click",
                        function() {
                            var i = a(this).parent("tr")[0];
                            d = i.nextSibling;
                            if (a(this).hasClass("sgcollapsed")) {
                                q = n.p.id;
                                p = i.id;
                                if (n.p.subGridOptions.reloadOnExpand === true || (n.p.subGridOptions.reloadOnExpand === false && !a(d).hasClass("ui-subgrid"))) {
                                    j = c >= 1 ? "<td colspan='" + c + "'>&#160;</td>": "";
                                    h = a(n).triggerHandler("jqGridSubGridBeforeExpand", [q + "_" + p, p]);
                                    h = (h === false || h === "stop") ? false: true;
                                    if (h && a.isFunction(n.p.subGridBeforeExpand)) {
                                        h = n.p.subGridBeforeExpand.call(n, q + "_" + p, p)
                                    }
                                    if (h === false) {
                                        return false
                                    }
                                    a(i).after("<tr role='row' class='ui-subgrid'>" + j + "<td class='ui-widget-content subgrid-cell'><span class='ui-icon " + n.p.subGridOptions.openicon + "'></span></td><td colspan='" + parseInt(n.p.colNames.length - 1 - l, 10) + "' class='ui-widget-content subgrid-data'><div id=" + q + "_" + p + " class='tablediv'></div></td></tr>");
                                    a(n).triggerHandler("jqGridSubGridRowExpanded", [q + "_" + p, p]);
                                    if (a.isFunction(n.p.subGridRowExpanded)) {
                                        n.p.subGridRowExpanded.call(n, q + "_" + p, p)
                                    } else {
                                        o(i)
                                    }
                                } else {
                                    a(d).show()
                                }
                                a(this).html("<a style='cursor:pointer;'><span class='ui-icon " + n.p.subGridOptions.minusicon + "'></span></a>").removeClass("sgcollapsed").addClass("sgexpanded");
                                if (n.p.subGridOptions.selectOnExpand) {
                                    a(n).jqGrid("setSelection", p)
                                }
                            } else {
                                if (a(this).hasClass("sgexpanded")) {
                                    h = a(n).triggerHandler("jqGridSubGridRowColapsed", [q + "_" + p, p]);
                                    h = (h === false || h === "stop") ? false: true;
                                    p = i.id;
                                    if (h && a.isFunction(n.p.subGridRowColapsed)) {
                                        h = n.p.subGridRowColapsed.call(n, q + "_" + p, p)
                                    }
                                    if (h === false) {
                                        return false
                                    }
                                    if (n.p.subGridOptions.reloadOnExpand === true) {
                                        a(d).remove(".ui-subgrid")
                                    } else {
                                        if (a(d).hasClass("ui-subgrid")) {
                                            a(d).hide()
                                        }
                                    }
                                    a(this).html("<a style='cursor:pointer;'><span class='ui-icon " + n.p.subGridOptions.plusicon + "'></span></a>").removeClass("sgexpanded").addClass("sgcollapsed");
                                    if (n.p.subGridOptions.selectOnCollapse) {
                                        a(n).jqGrid("setSelection", p)
                                    }
                                }
                            }
                            return false
                        })
                    }
                    k++
                }
                if (n.p.subGridOptions.expandOnLoad === true) {
                    a(n.rows).filter(".jqgrow").each(function(i, r) {
                        a(r.cells[0]).click()
                    })
                }
                n.subGridXml = function(r, i) {
                    e(r, i)
                };
                n.subGridJson = function(r, i) {
                    g(r, i)
                }
            })
        },
        expandSubGridRow: function(b) {
            return this.each(function() {
                var e = this;
                if (!e.grid && !b) {
                    return
                }
                if (e.p.subGrid === true) {
                    var c = a(this).jqGrid("getInd", b, true);
                    if (c) {
                        var d = a("td.sgcollapsed", c)[0];
                        if (d) {
                            a(d).trigger("click")
                        }
                    }
                }
            })
        },
        collapseSubGridRow: function(b) {
            return this.each(function() {
                var e = this;
                if (!e.grid && !b) {
                    return
                }
                if (e.p.subGrid === true) {
                    var c = a(this).jqGrid("getInd", b, true);
                    if (c) {
                        var d = a("td.sgexpanded", c)[0];
                        if (d) {
                            a(d).trigger("click")
                        }
                    }
                }
            })
        },
        toggleSubGridRow: function(b) {
            return this.each(function() {
                var e = this;
                if (!e.grid && !b) {
                    return
                }
                if (e.p.subGrid === true) {
                    var c = a(this).jqGrid("getInd", b, true);
                    if (c) {
                        var d = a("td.sgcollapsed", c)[0];
                        if (d) {
                            a(d).trigger("click")
                        } else {
                            d = a("td.sgexpanded", c)[0];
                            if (d) {
                                a(d).trigger("click")
                            }
                        }
                    }
                }
            })
        }
    })
})(jQuery);
function tableToGrid(a, b) {
    jQuery(a).each(function() {
        if (this.grid) {
            return
        }
        jQuery(this).width("99%");
        var m = jQuery(this).width();
        var o = jQuery("tr td:first-child input[type=checkbox]:first", jQuery(this));
        var h = jQuery("tr td:first-child input[type=radio]:first", jQuery(this));
        var d = o.length > 0;
        var g = !d && h.length > 0;
        var i = d || g;
        var k = [];
        var n = [];
        jQuery("th", jQuery(this)).each(function() {
            if (k.length === 0 && i) {
                k.push({
                    name: "__selection__",
                    index: "__selection__",
                    width: 0,
                    hidden: true
                });
                n.push("__selection__")
            } else {
                k.push({
                    name: jQuery(this).attr("id") || jQuery.trim(jQuery.jgrid.stripHtml(jQuery(this).html())).split(" ").join("_"),
                    index: jQuery(this).attr("id") || jQuery.trim(jQuery.jgrid.stripHtml(jQuery(this).html())).split(" ").join("_"),
                    width: jQuery(this).width() || 150
                });
                n.push(jQuery(this).html())
            }
        });
        var f = [];
        var e = [];
        var l = [];
        jQuery("tbody > tr", jQuery(this)).each(function() {
            var q = {};
            var p = 0;
            jQuery("td", jQuery(this)).each(function() {
                if (p === 0 && i) {
                    var r = jQuery("input", jQuery(this));
                    var s = r.attr("value");
                    e.push(s || f.length);
                    if (r.is(":checked")) {
                        l.push(s)
                    }
                    q[k[p].name] = r.attr("value")
                } else {
                    q[k[p].name] = jQuery(this).html()
                }
                p++
            });
            if (p > 0) {
                f.push(q)
            }
        });
        jQuery(this).empty();
        jQuery(this).addClass("scroll");
        jQuery(this).jqGrid(jQuery.extend({
            datatype: "local",
            width: m,
            colNames: n,
            colModel: k,
            multiselect: d
        },
        b || {}));
        var j;
        for (j = 0; j < f.length; j++) {
            var c = null;
            if (e.length > 0) {
                c = e[j];
                if (c && c.replace) {
                    c = encodeURIComponent(c).replace(/[.\-%]/g, "_")
                }
            }
            if (c === null) {
                c = j + 1
            }
            jQuery(this).jqGrid("addRowData", c, f[j])
        }
        for (j = 0; j < l.length; j++) {
            jQuery(this).jqGrid("setSelection", l[j])
        }
    })
} (function(a) {
    a.jgrid.extend({
        setTreeNode: function(c, b) {
            return this.each(function() {
                var q = this;
                if (!q.grid || !q.p.treeGrid) {
                    return
                }
                var j = q.p.expColInd,
                m = q.p.treeReader.expanded_field,
                t = q.p.treeReader.leaf_field,
                d = q.p.treeReader.level_field,
                s = q.p.treeReader.icon_field,
                o = q.p.treeReader.loaded,
                v, k, e, h, n, w, u, i;
                if (c == b) {
                    var l = a(q.rows[b - 1]).find(".treeclick");
                    l.removeClass(q.p.treeIcons.plus + " tree-plus");
                    l.removeClass(q.p.treeIcons.minus + " tree-minus");
                    l.addClass(q.p.treeIcons.leaf + " tree-leaf")
                }
                while (c < b) {
                    var g = a.jgrid.stripPref(q.p.idPrefix, q.rows[c].id),
                    f = q.p._index[g],
                    r;
                    u = q.p.data[f];
                    if (q.p.treeGridModel === "nested") {
                        if (!u[t]) {
                            v = parseInt(u[q.p.treeReader.left_field], 10);
                            k = parseInt(u[q.p.treeReader.right_field], 10);
                            u[t] = (k === v + 1) ? "true": "false";
                            q.rows[c].cells[q.p._treeleafpos].innerHTML = u[t]
                        }
                    }
                    e = parseInt(u[d], 10);
                    if (q.p.tree_root_level === 0) {
                        h = e + 1;
                        n = e
                    } else {
                        h = e;
                        n = e - 1
                    }
                    w = "<div class='tree-wrap tree-wrap-" + q.p.direction + "' style='width:" + (h * 18) + "px;'>";
                    w += "<div style='" + (q.p.direction === "rtl" ? "right:": "left:") + (n * 18) + "px;' class='ui-icon ";
                    if (u[o] !== undefined) {
                        if (u[o] === "true" || u[o] === true) {
                            u[o] = true
                        } else {
                            u[o] = false
                        }
                    }
                    if (u[t] === "true" || u[t] === true) {
                        w += ((u[s] !== undefined && u[s] !== "") ? u[s] : q.p.treeIcons.leaf) + " tree-leaf treeclick";
                        u[t] = true;
                        i = "leaf"
                    } else {
                        u[t] = false;
                        i = ""
                    }
                    u[m] = ((u[m] === "true" || u[m] === true) ? true: false) && (u[o] || u[o] === undefined);
                    if (u[m] === false) {
                        w += ((u[t] === true) ? "'": q.p.treeIcons.plus + " tree-plus treeclick'")
                    } else {
                        w += ((u[t] === true) ? "'": q.p.treeIcons.minus + " tree-minus treeclick'")
                    }
                    w += "></div></div>";
                    a(q.rows[c].cells[j]).wrapInner("<span class='cell-wrapper" + i + "'></span>").prepend(w);
                    if (e !== parseInt(q.p.tree_root_level, 10)) {
                        var p = a(q).jqGrid("getNodeParent", u);
                        r = p && p.hasOwnProperty(m) ? p[m] : true;
                        if (!r) {
                            a(q.rows[c]).css("display", "none")
                        }
                    }
                    a(q.rows[c].cells[j]).find("div.treeclick").bind("dblclick",
                    function(y) {
                        var x = a(this);
                        if (x.hasClass("tree-leaf")) {
                            x.addClass("tree-parent")
                        }
                        x.addClass("tree-reload").click();
                        if (x.hasClass("tree-plus")) {
                            x.click()
                        }
                    }).bind("click",
                    function(z) {
                        var y = z.target || z.srcElement,
                        B = a.jgrid.stripPref(q.p.idPrefix, a(y, q.rows).closest("tr.jqgrow")[0].id),
                        A = q.p._index[B];
                        if (a(this).hasClass("tree-parent")) {
                            a(this).removeClass("tree-parent");
                            if (a(this).hasClass("tree-leaf")) {
                                a(this).removeClass(q.p.treeIcons.leaf + " tree-leaf").addClass(q.p.treeIcons.minus + " tree-minus");
                                q.p.data[A][t] = false
                            }
                        }
                        if (!q.p.data[A][t]) {
                            if (q.p.data[A][m]) {
                                a(q).jqGrid("collapseRow", q.p.data[A]);
                                a(q).jqGrid("collapseNode", q.p.data[A])
                            } else {
                                if (a(this).hasClass("tree-reload")) {
                                    a(this).removeClass("tree-reload");
                                    var x = q.p.data[A];
                                    x[q.p.treeReader.loaded] = false;
                                    a.each(a(q).jqGrid("getNodeChildren", x),
                                    function(C, D) {
                                        D[q.p.treeReader.loaded] = false;
                                        a(q).jqGrid("delTreeNode", D[q.p.localReader.id])
                                    })
                                }
                                a(q).jqGrid("expandRow", q.p.data[A]);
                                a(q).jqGrid("expandNode", q.p.data[A])
                            }
                        }
                        return false
                    });
                    if (q.p.ExpandColClick === true) {
                        a(q.rows[c].cells[j]).find("span.cell-wrapper").css("cursor", "pointer").bind("click",
                        function(y) {
                            var x = y.target || y.srcElement,
                            A = a.jgrid.stripPref(q.p.idPrefix, a(x, q.rows).closest("tr.jqgrow")[0].id),
                            z = q.p._index[A];
                            if (!q.p.data[z][t]) {
                                if (q.p.data[z][m]) {
                                    a(q).jqGrid("collapseRow", q.p.data[z]);
                                    a(q).jqGrid("collapseNode", q.p.data[z])
                                } else {
                                    a(q).jqGrid("expandRow", q.p.data[z]);
                                    a(q).jqGrid("expandNode", q.p.data[z])
                                }
                            }
                            a(q).jqGrid("setSelection", A);
                            return false
                        })
                    }
                    c++
                }
            })
        },
        setTreeGrid: function() {
            return this.each(function() {
                var j = this,
                f = 0,
                d, h = false,
                c, e, g, b = [];
                if (!j.p.treeGrid) {
                    return
                }
                if (!j.p.treedatatype) {
                    a.extend(j.p, {
                        treedatatype: j.p.datatype
                    })
                }
                j.p.subGrid = false;
                j.p.altRows = false;
                j.p.pgbuttons = false;
                j.p.pginput = false;
                j.p.gridview = true;
                if (j.p.rowTotal === null) {
                    j.p.rowNum = 10000
                }
                j.p.multiselect = false;
                j.p.rowList = [];
                j.p.expColInd = 0;
                d = "ui-icon-triangle-1-" + (j.p.direction === "rtl" ? "w": "e");
                j.p.treeIcons = a.extend({
                    plus: d,
                    minus: "ui-icon-triangle-1-s",
                    leaf: "ui-icon-radio-off"
                },
                j.p.treeIcons || {});
                if (j.p.treeGridModel === "nested") {
                    j.p.treeReader = a.extend({
                        level_field: "level",
                        left_field: "lft",
                        right_field: "rgt",
                        leaf_field: "isLeaf",
                        expanded_field: "expanded",
                        loaded: "loaded",
                        icon_field: "icon"
                    },
                    j.p.treeReader)
                } else {
                    if (j.p.treeGridModel === "adjacency") {
                        j.p.treeReader = a.extend({
                            level_field: "level",
                            parent_id_field: "parent",
                            leaf_field: "isLeaf",
                            expanded_field: "expanded",
                            loaded: "loaded",
                            icon_field: "icon"
                        },
                        j.p.treeReader)
                    }
                }
                for (e in j.p.colModel) {
                    if (j.p.colModel.hasOwnProperty(e)) {
                        c = j.p.colModel[e].name;
                        if (c === j.p.ExpandColumn && !h) {
                            h = true;
                            j.p.expColInd = f
                        }
                        f++;
                        for (g in j.p.treeReader) {
                            if (j.p.treeReader.hasOwnProperty(g) && j.p.treeReader[g] === c) {
                                b.push(c)
                            }
                        }
                    }
                }
                a.each(j.p.treeReader,
                function(i, k) {
                    if (k && a.inArray(k, b) === -1) {
                        if (i === "leaf_field") {
                            j.p._treeleafpos = f
                        }
                        f++;
                        j.p.colNames.push(k);
                        j.p.colModel.push({
                            name: k,
                            width: 1,
                            hidden: true,
                            sortable: false,
                            resizable: false,
                            hidedlg: true,
                            editable: true,
                            search: false
                        })
                    }
                })
            })
        },
        expandRow: function(b) {
            this.each(function() {
                var e = this;
                if (!e.grid || !e.p.treeGrid) {
                    return
                }
                var d = a(e).jqGrid("getNodeChildren", b),
                c = e.p.treeReader.expanded_field;
                a(d).each(function() {
                    var f = e.p.idPrefix + a.jgrid.getAccessor(this, e.p.localReader.id);
                    a(a(e).jqGrid("getGridRowById", f)).css("display", "");
                    if (this[c]) {
                        a(e).jqGrid("expandRow", this)
                    }
                })
            })
        },
        collapseRow: function(b) {
            this.each(function() {
                var e = this;
                if (!e.grid || !e.p.treeGrid) {
                    return
                }
                var d = a(e).jqGrid("getNodeChildren", b),
                c = e.p.treeReader.expanded_field;
                a(d).each(function() {
                    var f = e.p.idPrefix + a.jgrid.getAccessor(this, e.p.localReader.id);
                    a(a(e).jqGrid("getGridRowById", f)).css("display", "none");
                    if (this[c]) {
                        a(e).jqGrid("collapseRow", this)
                    }
                })
            })
        },
        getRootNodes: function() {
            var b = [];
            this.each(function() {
                var e = this;
                if (!e.grid || !e.p.treeGrid) {
                    return
                }
                switch (e.p.treeGridModel) {
                case "nested":
                    var d = e.p.treeReader.level_field;
                    a(e.p.data).each(function() {
                        if (parseInt(this[d], 10) === parseInt(e.p.tree_root_level, 10)) {
                            b.push(this)
                        }
                    });
                    break;
                case "adjacency":
                    var c = e.p.treeReader.parent_id_field;
                    a(e.p.data).each(function() {
                        if (this[c] === null || String(this[c]).toLowerCase() === "null") {
                            b.push(this)
                        }
                    });
                    break
                }
            });
            return b
        },
        getNodeDepth: function(c) {
            var b = null;
            this.each(function() {
                if (!this.grid || !this.p.treeGrid) {
                    return
                }
                var e = this;
                switch (e.p.treeGridModel) {
                case "nested":
                    var d = e.p.treeReader.level_field;
                    b = parseInt(c[d], 10) - parseInt(e.p.tree_root_level, 10);
                    break;
                case "adjacency":
                    b = a(e).jqGrid("getNodeAncestors", c).length;
                    break
                }
            });
            return b
        },
        getNodeParent: function(c) {
            var b = null;
            this.each(function() {
                var h = this;
                if (!h.grid || !h.p.treeGrid) {
                    return
                }
                switch (h.p.treeGridModel) {
                case "nested":
                    var g = h.p.treeReader.left_field,
                    n = h.p.treeReader.right_field,
                    i = h.p.treeReader.level_field,
                    m = parseInt(c[g], 10),
                    l = parseInt(c[n], 10),
                    d = parseInt(c[i], 10);
                    a(this.p.data).each(function() {
                        if (parseInt(this[i], 10) === d - 1 && parseInt(this[g], 10) < m && parseInt(this[n], 10) > l) {
                            b = this;
                            return false
                        }
                    });
                    break;
                case "adjacency":
                    var j = h.p.treeReader.parent_id_field,
                    f = h.p.localReader.id,
                    e = c[f],
                    k = h.p._index[e];
                    while (k--) {
                        if (h.p.data[k][f] === a.jgrid.stripPref(h.p.idPrefix, c[j])) {
                            b = h.p.data[k];
                            break
                        }
                    }
                    break
                }
            });
            return b
        },
        getNodeChildren: function(c) {
            var b = [];
            this.each(function() {
                var g = this;
                if (!g.grid || !g.p.treeGrid) {
                    return
                }
                switch (g.p.treeGridModel) {
                case "nested":
                    var f = g.p.treeReader.left_field,
                    l = g.p.treeReader.right_field,
                    h = g.p.treeReader.level_field,
                    k = parseInt(c[f], 10),
                    j = parseInt(c[l], 10),
                    d = parseInt(c[h], 10);
                    a(this.p.data).each(function() {
                        if (parseInt(this[h], 10) === d + 1 && parseInt(this[f], 10) > k && parseInt(this[l], 10) < j) {
                            b.push(this)
                        }
                    });
                    break;
                case "adjacency":
                    var i = g.p.treeReader.parent_id_field,
                    e = g.p.localReader.id;
                    a(this.p.data).each(function() {
                        if (this[i] == a.jgrid.stripPref(g.p.idPrefix, c[e])) {
                            b.push(this)
                        }
                    });
                    break
                }
            });
            return b
        },
        getFullTreeNode: function(c) {
            var b = [];
            this.each(function() {
                var g = this,
                h;
                if (!g.grid || !g.p.treeGrid) {
                    return
                }
                switch (g.p.treeGridModel) {
                case "nested":
                    var f = g.p.treeReader.left_field,
                    m = g.p.treeReader.right_field,
                    i = g.p.treeReader.level_field,
                    l = parseInt(c[f], 10),
                    k = parseInt(c[m], 10),
                    d = parseInt(c[i], 10);
                    a(this.p.data).each(function() {
                        if (parseInt(this[i], 10) >= d && parseInt(this[f], 10) >= l && parseInt(this[f], 10) <= k) {
                            b.push(this)
                        }
                    });
                    break;
                case "adjacency":
                    if (c) {
                        b.push(c);
                        var j = g.p.treeReader.parent_id_field,
                        e = g.p.localReader.id;
                        a(this.p.data).each(function(n) {
                            h = b.length;
                            for (n = 0; n < h; n++) {
                                if (a.jgrid.stripPref(g.p.idPrefix, b[n][e]) === this[j]) {
                                    b.push(this);
                                    break
                                }
                            }
                        })
                    }
                    break
                }
            });
            return b
        },
        getNodeAncestors: function(c) {
            var b = [];
            this.each(function() {
                if (!this.grid || !this.p.treeGrid) {
                    return
                }
                var d = a(this).jqGrid("getNodeParent", c);
                while (d) {
                    b.push(d);
                    d = a(this).jqGrid("getNodeParent", d)
                }
            });
            return b
        },
        isVisibleNode: function(c) {
            var b = true;
            this.each(function() {
                var f = this;
                if (!f.grid || !f.p.treeGrid) {
                    return
                }
                var e = a(f).jqGrid("getNodeAncestors", c),
                d = f.p.treeReader.expanded_field;
                a(e).each(function() {
                    b = b && this[d];
                    if (!b) {
                        return false
                    }
                })
            });
            return b
        },
        isNodeLoaded: function(c) {
            var b;
            this.each(function() {
                var f = this;
                if (!f.grid || !f.p.treeGrid) {
                    return
                }
                var d = f.p.treeReader.leaf_field,
                e = f.p.treeReader.loaded;
                if (c !== undefined) {
                    if (c[e] !== undefined) {
                        b = c[e]
                    } else {
                        if (c[d] || a(f).jqGrid("getNodeChildren", c).length > 0) {
                            b = true
                        } else {
                            b = false
                        }
                    }
                } else {
                    b = false
                }
            });
            return b
        },
        expandNode: function(b) {
            return this.each(function() {
                if (!this.grid || !this.p.treeGrid) {
                    return
                }
                var h = this.p.treeReader.expanded_field,
                i = this.p.treeReader.parent_id_field,
                f = this.p.treeReader.loaded,
                c = this.p.treeReader.level_field,
                k = this.p.treeReader.left_field,
                j = this.p.treeReader.right_field;
                if (!b[h]) {
                    var d = a.jgrid.getAccessor(b, this.p.localReader.id);
                    var e = a("#" + this.p.idPrefix + a.jgrid.jqID(d), this.grid.bDiv)[0];
                    var g = this.p._index[d];
                    if (a(this).jqGrid("isNodeLoaded", this.p.data[g])) {
                        b[h] = true;
                        a("div.treeclick", e).removeClass(this.p.treeIcons.plus + " tree-plus").addClass(this.p.treeIcons.minus + " tree-minus")
                    } else {
                        if (!this.grid.hDiv.loading) {
                            b[h] = true;
                            a("div.treeclick", e).removeClass(this.p.treeIcons.plus + " tree-plus").addClass(this.p.treeIcons.minus + " tree-minus");
                            this.p.treeANode = e.rowIndex;
                            this.p.datatype = this.p.treedatatype;
                            if (this.p.treeGridModel === "nested") {
                                a(this).jqGrid("setGridParam", {
                                    postData: {
                                        nodeid: d,
                                        n_left: b[k],
                                        n_right: b[j],
                                        n_level: b[c]
                                    }
                                })
                            } else {
                                a(this).jqGrid("setGridParam", {
                                    postData: {
                                        nodeid: d,
                                        parentid: b[i],
                                        n_level: b[c]
                                    }
                                })
                            }
                            a(this).trigger("reloadGrid");
                            b[f] = true;
                            if (this.p.treeGridModel === "nested") {
                                a(this).jqGrid("setGridParam", {
                                    postData: {
                                        nodeid: "",
                                        n_left: "",
                                        n_right: "",
                                        n_level: ""
                                    }
                                })
                            } else {
                                a(this).jqGrid("setGridParam", {
                                    postData: {
                                        nodeid: "",
                                        parentid: "",
                                        n_level: ""
                                    }
                                })
                            }
                        }
                    }
                }
                if (a.isFunction(this.p.onExpandNode)) {
                    this.p.onExpandNode(b)
                }
            })
        },
        collapseNode: function(b) {
            return this.each(function() {
                if (!this.grid || !this.p.treeGrid) {
                    return
                }
                var d = this.p.treeReader.expanded_field;
                if (b[d]) {
                    b[d] = false;
                    var e = a.jgrid.getAccessor(b, this.p.localReader.id);
                    var c = a("#" + this.p.idPrefix + a.jgrid.jqID(e), this.grid.bDiv)[0];
                    a("div.treeclick", c).removeClass(this.p.treeIcons.minus + " tree-minus").addClass(this.p.treeIcons.plus + " tree-plus")
                }
                if (a.isFunction(this.p.onCollapseNode)) {
                    this.p.onCollapseNode(b)
                }
            })
        },
        SortTree: function(e, c, b, d) {
            return this.each(function() {
                if (!this.grid || !this.p.treeGrid) {
                    return
                }
                var k, f, m, j = [],
                n = this,
                l,
                h,
                g = a(this).jqGrid("getRootNodes");
                l = a.jgrid.from(g);
                l.orderBy(e, c, b, d);
                h = l.select();
                for (k = 0, f = h.length; k < f; k++) {
                    m = h[k];
                    j.push(m);
                    a(this).jqGrid("collectChildrenSortTree", j, m, e, c, b, d)
                }
                a.each(j,
                function(i) {
                    var o = a.jgrid.getAccessor(this, n.p.localReader.id);
                    a("#" + a.jgrid.jqID(n.p.id) + " tbody tr:eq(" + i + ")").after(a("tr#" + a.jgrid.jqID(o), n.grid.bDiv))
                });
                l = null;
                h = null;
                j = null
            })
        },
        collectChildrenSortTree: function(b, f, g, d, c, e) {
            return this.each(function() {
                if (!this.grid || !this.p.treeGrid) {
                    return
                }
                var k, h, n, l, m, j;
                l = a(this).jqGrid("getNodeChildren", f);
                m = a.jgrid.from(l);
                m.orderBy(g, d, c, e);
                j = m.select();
                for (k = 0, h = j.length; k < h; k++) {
                    n = j[k];
                    b.push(n);
                    a(this).jqGrid("collectChildrenSortTree", b, n, g, d, c, e)
                }
            })
        },
        setTreeRow: function(b, c) {
            var d = false;
            this.each(function() {
                var e = this;
                if (!e.grid || !e.p.treeGrid) {
                    return
                }
                d = a(e).jqGrid("setRowData", b, c)
            });
            return d
        },
        delTreeNode: function(b) {
            return this.each(function() {
                var h = this,
                n = h.p.localReader.id,
                j, g = h.p.treeReader.left_field,
                m = h.p.treeReader.right_field,
                d, e, k, l;
                if (!h.grid || !h.p.treeGrid) {
                    return
                }
                var c = h.p._index[b];
                if (c !== undefined) {
                    d = parseInt(h.p.data[c][m], 10);
                    e = d - parseInt(h.p.data[c][g], 10) + 1;
                    var f = a(h).jqGrid("getFullTreeNode", h.p.data[c]);
                    if (f.length > 0) {
                        for (j = 0; j < f.length; j++) {
                            a(h).jqGrid("delRowData", f[j][n])
                        }
                    }
                    if (h.p.treeGridModel === "nested") {
                        k = a.jgrid.from(h.p.data).greater(g, d, {
                            stype: "integer"
                        }).select();
                        if (k.length) {
                            for (l in k) {
                                if (k.hasOwnProperty(l)) {
                                    k[l][g] = parseInt(k[l][g], 10) - e
                                }
                            }
                        }
                        k = a.jgrid.from(h.p.data).greater(m, d, {
                            stype: "integer"
                        }).select();
                        if (k.length) {
                            for (l in k) {
                                if (k.hasOwnProperty(l)) {
                                    k[l][m] = parseInt(k[l][m], 10) - e
                                }
                            }
                        }
                    }
                }
            })
        },
        addChildNode: function(g, n, z, k) {
            var t = this[0];
            if (z) {
                var o = t.p.treeReader.expanded_field,
                w = t.p.treeReader.leaf_field,
                b = t.p.treeReader.level_field,
                h = t.p.treeReader.parent_id_field,
                d = t.p.treeReader.left_field,
                x = t.p.treeReader.right_field,
                p = t.p.treeReader.loaded,
                c, y, j, m, r, s, q = 0,
                l = n,
                v, u;
                if (k === undefined) {
                    k = false
                }
                if (g == null) {
                    r = t.p.data.length - 1;
                    if (r >= 0) {
                        while (r >= 0) {
                            q = Math.max(q, parseInt(t.p.data[r][t.p.localReader.id], 10));
                            r--
                        }
                    }
                    g = q + 1
                }
                var C = a(t).jqGrid("getInd", n);
                v = false;
                if (n === undefined || n === null || n === "") {
                    n = null;
                    l = null;
                    c = "last";
                    m = t.p.tree_root_level;
                    r = t.p.data.length + 1
                } else {
                    c = "after";
                    y = t.p._index[n];
                    j = t.p.data[y];
                    n = j[t.p.localReader.id];
                    m = parseInt(j[b], 10) + 1;
                    var e = a(t).jqGrid("getFullTreeNode", j);
                    if (e.length) {
                        r = e[e.length - 1][t.p.localReader.id];
                        l = r;
                        r = a(t).jqGrid("getInd", l) + 1
                    } else {
                        r = a(t).jqGrid("getInd", n) + 1
                    }
                    if (j[w]) {
                        v = true;
                        j[o] = true;
                        a(t.rows[C]).find("span.cell-wrapperleaf").removeClass("cell-wrapperleaf").addClass("cell-wrapper").end().find("div.tree-leaf").removeClass(t.p.treeIcons.leaf + " tree-leaf").addClass(t.p.treeIcons.minus + " tree-minus");
                        t.p.data[y][w] = false;
                        j[p] = true
                    }
                }
                s = r + 1;
                if (z[o] === undefined) {
                    z[o] = false
                }
                if (z[p] === undefined) {
                    z[p] = false
                }
                z[b] = m;
                if (z[w] === undefined) {
                    z[w] = true
                }
                if (t.p.treeGridModel === "adjacency") {
                    z[h] = n
                }
                if (t.p.treeGridModel === "nested") {
                    var f, B, A;
                    if (n !== null) {
                        u = parseInt(j[x], 10);
                        f = a.jgrid.from(t.p.data);
                        f = f.greaterOrEquals(x, u, {
                            stype: "integer"
                        });
                        B = f.select();
                        if (B.length) {
                            for (A in B) {
                                if (B.hasOwnProperty(A)) {
                                    B[A][d] = B[A][d] > u ? parseInt(B[A][d], 10) + 2 : B[A][d];
                                    B[A][x] = B[A][x] >= u ? parseInt(B[A][x], 10) + 2 : B[A][x]
                                }
                            }
                        }
                        z[d] = u;
                        z[x] = u + 1
                    } else {
                        u = parseInt(a(t).jqGrid("getCol", x, false, "max"), 10);
                        B = a.jgrid.from(t.p.data).greater(d, u, {
                            stype: "integer"
                        }).select();
                        if (B.length) {
                            for (A in B) {
                                if (B.hasOwnProperty(A)) {
                                    B[A][d] = parseInt(B[A][d], 10) + 2
                                }
                            }
                        }
                        B = a.jgrid.from(t.p.data).greater(x, u, {
                            stype: "integer"
                        }).select();
                        if (B.length) {
                            for (A in B) {
                                if (B.hasOwnProperty(A)) {
                                    B[A][x] = parseInt(B[A][x], 10) + 2
                                }
                            }
                        }
                        z[d] = u + 1;
                        z[x] = u + 2
                    }
                }
                if (n === null || a(t).jqGrid("isNodeLoaded", j) || v) {
                    a(t).jqGrid("addRowData", g, z, c, l);
                    a(t).jqGrid("setTreeNode", r, s)
                }
                if (j && !j[o] && k) {
                    a(t.rows[C]).find("div.treeclick").click()
                }
            }
        }
    })
})(jQuery); (function(c) {
    c.fn.jqDrag = function(f) {
        return d(this, f, "d")
    };
    c.fn.jqResize = function(i, f) {
        return d(this, i, "r", f)
    };
    c.jqDnR = {
        dnr: {},
        e: 0,
        drag: function(f) {
            if (g.k == "d") {
                k.css({
                    left: g.X + f.pageX - g.pX,
                    top: g.Y + f.pageY - g.pY
                })
            } else {
                k.css({
                    width: Math.max(f.pageX - g.pX + g.W, 0),
                    height: Math.max(f.pageY - g.pY + g.H, 0)
                });
                if (a) {
                    j.css({
                        width: Math.max(f.pageX - a.pX + a.W, 0),
                        height: Math.max(f.pageY - a.pY + a.H, 0)
                    })
                }
            }
            return false
        },
        stop: function() {
            c(document).unbind("mousemove", h.drag).unbind("mouseup", h.stop)
        }
    };
    var h = c.jqDnR,
    g = h.dnr,
    k = h.e,
    j, a, d = function(m, l, i, f) {
        return m.each(function() {
            l = (l) ? c(l, m) : m;
            l.bind("mousedown", {
                e: m,
                k: i
            },
            function(n) {
                var s = n.data,
                r = {};
                k = s.e;
                j = f ? c(f) : false;
                if (k.css("position") != "relative") {
                    try {
                        k.position(r)
                    } catch(q) {}
                }
                g = {
                    X: r.left || e("left") || 0,
                    Y: r.top || e("top") || 0,
                    W: e("width") || k[0].scrollWidth || 0,
                    H: e("height") || k[0].scrollHeight || 0,
                    pX: n.pageX,
                    pY: n.pageY,
                    k: s.k
                };
                if (j && s.k != "d") {
                    a = {
                        X: r.left || b("left") || 0,
                        Y: r.top || b("top") || 0,
                        W: j[0].offsetWidth || b("width") || 0,
                        H: j[0].offsetHeight || b("height") || 0,
                        pX: n.pageX,
                        pY: n.pageY,
                        k: s.k
                    }
                } else {
                    a = false
                }
                if (c("input.hasDatepicker", k[0])[0]) {
                    try {
                        c("input.hasDatepicker", k[0]).datepicker("hide")
                    } catch(o) {}
                }
                c(document).mousemove(c.jqDnR.drag).mouseup(c.jqDnR.stop);
                return false
            })
        })
    },
    e = function(f) {
        return parseInt(k.css(f), 10) || false
    },
    b = function(f) {
        return parseInt(j.css(f), 10) || false
    }
})(jQuery); (function(c) {
    c.fn.jqm = function(f) {
        var e = {
            overlay: 50,
            closeoverlay: true,
            overlayClass: "jqmOverlay",
            closeClass: "jqmClose",
            trigger: ".jqModal",
            ajax: k,
            ajaxText: "",
            target: k,
            modal: k,
            toTop: k,
            onShow: k,
            onHide: k,
            onLoad: k
        };
        return this.each(function() {
            if (this._jqm) {
                return j[this._jqm].c = c.extend({},
                j[this._jqm].c, f)
            }
            l++;
            this._jqm = l;
            j[l] = {
                c: c.extend(e, c.jqm.params, f),
                a: k,
                w: c(this).addClass("jqmID" + l),
                s: l
            };
            if (e.trigger) {
                c(this).jqmAddTrigger(e.trigger)
            }
        })
    };
    c.fn.jqmAddClose = function(f) {
        return i(this, f, "jqmHide")
    };
    c.fn.jqmAddTrigger = function(f) {
        return i(this, f, "jqmShow")
    };
    c.fn.jqmShow = function(e) {
        return this.each(function() {
            c.jqm.open(this._jqm, e)
        })
    };
    c.fn.jqmHide = function(e) {
        return this.each(function() {
            c.jqm.close(this._jqm, e)
        })
    };
    c.jqm = {
        hash: {},
        open: function(x, w) {
            var n = j[x],
            p = n.c,
            m = "." + p.closeClass,
            q = (parseInt(n.w.css("z-index")));
            q = (q > 0) ? q: 3000;
            var f = c("<div></div>").css({
                height: "100%",
                width: "100%",
                position: "fixed",
                left: 0,
                top: 0,
                "z-index": q - 1,
                opacity: p.overlay / 100
            });
            if (n.a) {
                return k
            }
            n.t = w;
            n.a = true;
            n.w.css("z-index", q);
            if (p.modal) {
                if (!a[0]) {
                    setTimeout(function() {
                        h("bind")
                    },
                    1)
                }
                a.push(x)
            } else {
                if (p.overlay > 0) {
                    if (p.closeoverlay) {
                        n.w.jqmAddClose(f)
                    }
                } else {
                    f = k
                }
            }
            n.o = (f) ? f.addClass(p.overlayClass).prependTo("body") : k;
            if (p.ajax) {
                var e = p.target || n.w,
                v = p.ajax;
                e = (typeof e == "string") ? c(e, n.w) : c(e);
                v = (v.substr(0, 1) == "@") ? c(w).attr(v.substring(1)) : v;
                e.html(p.ajaxText).load(v,
                function() {
                    if (p.onLoad) {
                        p.onLoad.call(this, n)
                    }
                    if (m) {
                        n.w.jqmAddClose(c(m, n.w))
                    }
                    g(n)
                })
            } else {
                if (m) {
                    n.w.jqmAddClose(c(m, n.w))
                }
            }
            if (p.toTop && n.o) {
                n.w.before('<span id="jqmP' + n.w[0]._jqm + '"></span>').insertAfter(n.o)
            } (p.onShow) ? p.onShow(n) : n.w.show();
            g(n);
            return k
        },
        close: function(f) {
            var e = j[f];
            if (!e.a) {
                return k
            }
            e.a = k;
            if (a[0]) {
                a.pop();
                if (!a[0]) {
                    h("unbind")
                }
            }
            if (e.c.toTop && e.o) {
                c("#jqmP" + e.w[0]._jqm).after(e.w).remove()
            }
            if (e.c.onHide) {
                e.c.onHide(e)
            } else {
                e.w.hide();
                if (e.o) {
                    e.o.remove()
                }
            }
            return k
        },
        params: {}
    };
    var l = 0,
    j = c.jqm.hash,
    a = [],
    k = false,
    g = function(e) {
        d(e)
    },
    d = function(f) {
        try {
            c(":input:visible", f.w)[0].focus()
        } catch(e) {}
    },
    h = function(e) {
        c(document)[e]("keypress", b)[e]("keydown", b)[e]("mousedown", b)
    },
    b = function(n) {
        var f = j[a[a.length - 1]],
        m = (!c(n.target).parents(".jqmID" + f.s)[0]);
        if (m) {
            c(".jqmID" + f.s).each(function() {
                var o = c(this),
                e = o.offset();
                if (e.top <= n.pageY && n.pageY <= e.top + o.height() && e.left <= n.pageX && n.pageX <= e.left + o.width()) {
                    m = false;
                    return false
                }
            });
            d(f)
        }
        return ! m
    },
    i = function(e, f, m) {
        return e.each(function() {
            var n = this._jqm;
            c(f).each(function() {
                if (!this[m]) {
                    this[m] = [];
                    c(this).click(function() {
                        for (var o in {
                            jqmShow: 1,
                            jqmHide: 1
                        }) {
                            for (var p in this[o]) {
                                if (j[this[o][p]]) {
                                    j[this[o][p]].w[o](this)
                                }
                            }
                        }
                        return k
                    })
                }
                this[m].push(n)
            })
        })
    }
})(jQuery); (function(a) {
    a.fmatter = {};
    a.extend(a.fmatter, {
        isBoolean: function(b) {
            return typeof b === "boolean"
        },
        isObject: function(b) {
            return (b && (typeof b === "object" || a.isFunction(b))) || false
        },
        isString: function(b) {
            return typeof b === "string"
        },
        isNumber: function(b) {
            return typeof b === "number" && isFinite(b)
        },
        isValue: function(b) {
            return (this.isObject(b) || this.isString(b) || this.isNumber(b) || this.isBoolean(b))
        },
        isEmpty: function(b) {
            if (!this.isString(b) && this.isValue(b)) {
                return false
            }
            if (!this.isValue(b)) {
                return true
            }
            b = a.trim(b).replace(/\&nbsp\;/ig, "").replace(/\&#160\;/ig, "");
            return b === ""
        }
    });
    a.fn.fmatter = function(g, h, f, b, c) {
        var d = h;
        f = a.extend({},
        a.jgrid.formatter, f);
        try {
            d = a.fn.fmatter[g].call(this, h, f, b, c)
        } catch(e) {}
        return d
    };
    a.fmatter.util = {
        NumberFormat: function(d, b) {
            if (!a.fmatter.isNumber(d)) {
                d *= 1
            }
            if (a.fmatter.isNumber(d)) {
                var f = (d < 0);
                var l = String(d);
                var h = b.decimalSeparator || ".";
                var j;
                if (a.fmatter.isNumber(b.decimalPlaces)) {
                    var k = b.decimalPlaces;
                    var e = Math.pow(10, k);
                    l = String(Math.round(d * e) / e);
                    j = l.lastIndexOf(".");
                    if (k > 0) {
                        if (j < 0) {
                            l += h;
                            j = l.length - 1
                        } else {
                            if (h !== ".") {
                                l = l.replace(".", h)
                            }
                        }
                        while ((l.length - 1 - j) < k) {
                            l += "0"
                        }
                    }
                }
                if (b.thousandsSeparator) {
                    var n = b.thousandsSeparator;
                    j = l.lastIndexOf(h);
                    j = (j > -1) ? j: l.length;
                    var m = l.substring(j);
                    var c = -1,
                    g;
                    for (g = j; g > 0; g--) {
                        c++;
                        if ((c % 3 === 0) && (g !== j) && (!f || (g > 1))) {
                            m = n + m
                        }
                        m = l.charAt(g - 1) + m
                    }
                    l = m
                }
                l = (b.prefix) ? b.prefix + l: l;
                l = (b.suffix) ? l + b.suffix: l;
                return l
            }
            return d
        }
    };
    a.fn.fmatter.defaultFormat = function(c, b) {
        return (a.fmatter.isValue(c) && c !== "") ? c: b.defaultValue || "&#160;"
    };
    a.fn.fmatter.email = function(c, b) {
        if (!a.fmatter.isEmpty(c)) {
            return '<a href="mailto:' + c + '">' + c + "</a>"
        }
        return a.fn.fmatter.defaultFormat(c, b)
    };
    a.fn.fmatter.checkbox = function(e, c) {
        var f = a.extend({},
        c.checkbox),
        d;
        if (c.colModel !== undefined && c.colModel.formatoptions !== undefined) {
            f = a.extend({},
            f, c.colModel.formatoptions)
        }
        if (f.disabled === true) {
            d = 'disabled="disabled"'
        } else {
            d = ""
        }
        if (a.fmatter.isEmpty(e) || e === undefined) {
            e = a.fn.fmatter.defaultFormat(e, f)
        }
        e = String(e);
        e = (e + "").toLowerCase();
        var b = e.search(/(false|f|0|no|n|off|undefined)/i) < 0 ? " checked='checked' ": "";
        return '<input type="checkbox" ' + b + ' value="' + e + '" offval="no" ' + d + "/>"
    };
    a.fn.fmatter.link = function(d, b) {
        var e = {
            target: b.target
        };
        var c = "";
        if (b.colModel !== undefined && b.colModel.formatoptions !== undefined) {
            e = a.extend({},
            e, b.colModel.formatoptions)
        }
        if (e.target) {
            c = "target=" + e.target
        }
        if (!a.fmatter.isEmpty(d)) {
            return "<a " + c + ' href="' + d + '">' + d + "</a>"
        }
        return a.fn.fmatter.defaultFormat(d, b)
    };
    a.fn.fmatter.showlink = function(d, b) {
        var f = {
            baseLinkUrl: b.baseLinkUrl,
            showAction: b.showAction,
            addParam: b.addParam || "",
            target: b.target,
            idName: b.idName
        },
        c = "",
        e;
        if (b.colModel !== undefined && b.colModel.formatoptions !== undefined) {
            f = a.extend({},
            f, b.colModel.formatoptions)
        }
        if (f.target) {
            c = "target=" + f.target
        }
        e = f.baseLinkUrl + f.showAction + "?" + f.idName + "=" + b.rowId + f.addParam;
        if (a.fmatter.isString(d) || a.fmatter.isNumber(d)) {
            return "<a " + c + ' href="' + e + '">' + d + "</a>"
        }
        return a.fn.fmatter.defaultFormat(d, b)
    };
    a.fn.fmatter.integer = function(c, b) {
        var d = a.extend({},
        b.integer);
        if (b.colModel !== undefined && b.colModel.formatoptions !== undefined) {
            d = a.extend({},
            d, b.colModel.formatoptions)
        }
        if (a.fmatter.isEmpty(c)) {
            return d.defaultValue
        }
        return a.fmatter.util.NumberFormat(c, d)
    };
    a.fn.fmatter.number = function(c, b) {
        var d = a.extend({},
        b.number);
        if (b.colModel !== undefined && b.colModel.formatoptions !== undefined) {
            d = a.extend({},
            d, b.colModel.formatoptions)
        }
        if (a.fmatter.isEmpty(c)) {
            return d.defaultValue
        }
        return a.fmatter.util.NumberFormat(c, d)
    };
    a.fn.fmatter.currency = function(c, b) {
        var d = a.extend({},
        b.currency);
        if (b.colModel !== undefined && b.colModel.formatoptions !== undefined) {
            d = a.extend({},
            d, b.colModel.formatoptions)
        }
        if (a.fmatter.isEmpty(c)) {
            return d.defaultValue
        }
        return a.fmatter.util.NumberFormat(c, d)
    };
    a.fn.fmatter.date = function(e, d, b, c) {
        var f = a.extend({},
        d.date);
        if (d.colModel !== undefined && d.colModel.formatoptions !== undefined) {
            f = a.extend({},
            f, d.colModel.formatoptions)
        }
        if (!f.reformatAfterEdit && c === "edit") {
            return a.fn.fmatter.defaultFormat(e, d)
        }
        if (!a.fmatter.isEmpty(e)) {
            return a.jgrid.parseDate(f.srcformat, e, f.newformat, f)
        }
        return a.fn.fmatter.defaultFormat(e, d)
    };
    a.fn.fmatter.select = function(g, b) {
        g = String(g);
        var e = false,
        k = [],
        o,
        d;
        if (b.colModel.formatoptions !== undefined) {
            e = b.colModel.formatoptions.value;
            o = b.colModel.formatoptions.separator === undefined ? ":": b.colModel.formatoptions.separator;
            d = b.colModel.formatoptions.delimiter === undefined ? ";": b.colModel.formatoptions.delimiter
        } else {
            if (b.colModel.editoptions !== undefined) {
                e = b.colModel.editoptions.value;
                o = b.colModel.editoptions.separator === undefined ? ":": b.colModel.editoptions.separator;
                d = b.colModel.editoptions.delimiter === undefined ? ";": b.colModel.editoptions.delimiter
            }
        }
        if (e) {
            var n = (b.colModel.editoptions != null && b.colModel.editoptions.multiple === true) === true ? true: false,
            m = [],
            l;
            if (n) {
                m = g.split(",");
                m = a.map(m,
                function(i) {
                    return a.trim(i)
                })
            }
            if (a.fmatter.isString(e)) {
                var c = e.split(d),
                f = 0,
                h;
                for (h = 0; h < c.length; h++) {
                    l = c[h].split(o);
                    if (l.length > 2) {
                        l[1] = a.map(l,
                        function(p, j) {
                            if (j > 0) {
                                return p
                            }
                        }).join(o)
                    }
                    if (n) {
                        if (a.inArray(l[0], m) > -1) {
                            k[f] = l[1];
                            f++
                        }
                    } else {
                        if (a.trim(l[0]) === a.trim(g)) {
                            k[0] = l[1];
                            break
                        }
                    }
                }
            } else {
                if (a.fmatter.isObject(e)) {
                    if (n) {
                        k = a.map(m,
                        function(i) {
                            return e[i]
                        })
                    } else {
                        k[0] = e[g] || ""
                    }
                }
            }
        }
        g = k.join(", ");
        return g === "" ? a.fn.fmatter.defaultFormat(g, b) : g
    };
    a.fn.fmatter.rowactions = function(h) {
        var g = a(this).closest("tr.jqgrow"),
        k = g.attr("id"),
        n = a(this).closest("table.ui-jqgrid-btable").attr("id").replace(/_frozen([^_]*)$/, "$1"),
        l = a("#" + n),
        d = l[0],
        b = d.p,
        j = b.colModel[a.jgrid.getCellIndex(this)],
        m = j.frozen ? a("tr#" + k + " td:eq(" + a.jgrid.getCellIndex(this) + ") > div", l) : a(this).parent(),
        f = {
            extraparam: {}
        },
        c = function(p, o) {
            if (a.isFunction(f.afterSave)) {
                f.afterSave.call(d, p, o)
            }
            m.find("div.ui-inline-edit,div.ui-inline-del").show();
            m.find("div.ui-inline-save,div.ui-inline-cancel").hide()
        },
        i = function(o) {
            if (a.isFunction(f.afterRestore)) {
                f.afterRestore.call(d, o)
            }
            m.find("div.ui-inline-edit,div.ui-inline-del").show();
            m.find("div.ui-inline-save,div.ui-inline-cancel").hide()
        };
        if (j.formatoptions !== undefined) {
            f = a.extend(f, j.formatoptions)
        }
        if (b.editOptions !== undefined) {
            f.editOptions = b.editOptions
        }
        if (b.delOptions !== undefined) {
            f.delOptions = b.delOptions
        }
        if (g.hasClass("jqgrid-new-row")) {
            f.extraparam[b.prmNames.oper] = b.prmNames.addoper
        }
        var e = {
            keys: f.keys,
            oneditfunc: f.onEdit,
            successfunc: f.onSuccess,
            url: f.url,
            extraparam: f.extraparam,
            aftersavefunc: c,
            errorfunc: f.onError,
            afterrestorefunc: i,
            restoreAfterError: f.restoreAfterError,
            mtype: f.mtype
        };
        switch (h) {
        case "edit":
            l.jqGrid("editRow", k, e);
            m.find("div.ui-inline-edit,div.ui-inline-del").hide();
            m.find("div.ui-inline-save,div.ui-inline-cancel").show();
            l.triggerHandler("jqGridAfterGridComplete");
            break;
        case "save":
            if (l.jqGrid("saveRow", k, e)) {
                m.find("div.ui-inline-edit,div.ui-inline-del").show();
                m.find("div.ui-inline-save,div.ui-inline-cancel").hide();
                l.triggerHandler("jqGridAfterGridComplete")
            }
            break;
        case "cancel":
            l.jqGrid("restoreRow", k, i);
            m.find("div.ui-inline-edit,div.ui-inline-del").show();
            m.find("div.ui-inline-save,div.ui-inline-cancel").hide();
            l.triggerHandler("jqGridAfterGridComplete");
            break;
        case "del":
            l.jqGrid("delGridRow", k, f.delOptions);
            break;
        case "formedit":
            l.jqGrid("setSelection", k);
            l.jqGrid("editGridRow", k, f.editOptions);
            break
        }
    };
    a.fn.fmatter.actions = function(e, c) {
        var g = {
            keys: false,
            editbutton: true,
            delbutton: true,
            editformbutton: false
        },
        b = c.rowId,
        f = "",
        d;
        if (c.colModel.formatoptions !== undefined) {
            g = a.extend(g, c.colModel.formatoptions)
        }
        if (b === undefined || a.fmatter.isEmpty(b)) {
            return ""
        }
        if (g.editformbutton) {
            d = "id='jEditButton_" + b + "' onclick=jQuery.fn.fmatter.rowactions.call(this,'formedit'); onmouseover=jQuery(this).addClass('ui-state-hover'); onmouseout=jQuery(this).removeClass('ui-state-hover'); ";
            f += "<div title='" + a.jgrid.nav.edittitle + "' style='float:left;cursor:pointer;' class='ui-pg-div ui-inline-edit' " + d + "><span class='ui-icon ui-icon-pencil'></span></div>"
        } else {
            if (g.editbutton) {
                d = "id='jEditButton_" + b + "' onclick=jQuery.fn.fmatter.rowactions.call(this,'edit'); onmouseover=jQuery(this).addClass('ui-state-hover'); onmouseout=jQuery(this).removeClass('ui-state-hover') ";
                f += "<div title='" + a.jgrid.nav.edittitle + "' style='float:left;cursor:pointer;' class='ui-pg-div ui-inline-edit' " + d + "><span class='ui-icon ui-icon-pencil'></span></div>"
            }
        }
        if (g.delbutton) {
            d = "id='jDeleteButton_" + b + "' onclick=jQuery.fn.fmatter.rowactions.call(this,'del'); onmouseover=jQuery(this).addClass('ui-state-hover'); onmouseout=jQuery(this).removeClass('ui-state-hover'); ";
            f += "<div title='" + a.jgrid.nav.deltitle + "' style='float:left;margin-left:5px;' class='ui-pg-div ui-inline-del' " + d + "><span class='ui-icon ui-icon-trash'></span></div>"
        }
        d = "id='jSaveButton_" + b + "' onclick=jQuery.fn.fmatter.rowactions.call(this,'save'); onmouseover=jQuery(this).addClass('ui-state-hover'); onmouseout=jQuery(this).removeClass('ui-state-hover'); ";
        f += "<div title='" + a.jgrid.edit.bSubmit + "' style='float:left;display:none' class='ui-pg-div ui-inline-save' " + d + "><span class='ui-icon ui-icon-disk'></span></div>";
        d = "id='jCancelButton_" + b + "' onclick=jQuery.fn.fmatter.rowactions.call(this,'cancel'); onmouseover=jQuery(this).addClass('ui-state-hover'); onmouseout=jQuery(this).removeClass('ui-state-hover'); ";
        f += "<div title='" + a.jgrid.edit.bCancel + "' style='float:left;display:none;margin-left:5px;' class='ui-pg-div ui-inline-cancel' " + d + "><span class='ui-icon ui-icon-cancel'></span></div>";
        return "<div style='margin-left:8px;'>" + f + "</div>"
    };
    a.unformat = function(e, m, j, c) {
        var h, f = m.colModel.formatter,
        g = m.colModel.formatoptions || {},
        n, l = /([\.\*\_\'\(\)\{\}\+\?\\])/g,
        i = m.colModel.unformat || (a.fn.fmatter[f] && a.fn.fmatter[f].unformat);
        if (i !== undefined && a.isFunction(i)) {
            h = i.call(this, a(e).text(), m, e)
        } else {
            if (f !== undefined && a.fmatter.isString(f)) {
                var b = a.jgrid.formatter || {},
                k;
                switch (f) {
                case "integer":
                    g = a.extend({},
                    b.integer, g);
                    n = g.thousandsSeparator.replace(l, "\\$1");
                    k = new RegExp(n, "g");
                    h = a(e).text().replace(k, "");
                    break;
                case "number":
                    g = a.extend({},
                    b.number, g);
                    n = g.thousandsSeparator.replace(l, "\\$1");
                    k = new RegExp(n, "g");
                    h = a(e).text().replace(k, "").replace(g.decimalSeparator, ".");
                    break;
                case "currency":
                    g = a.extend({},
                    b.currency, g);
                    n = g.thousandsSeparator.replace(l, "\\$1");
                    k = new RegExp(n, "g");
                    h = a(e).text();
                    if (g.prefix && g.prefix.length) {
                        h = h.substr(g.prefix.length)
                    }
                    if (g.suffix && g.suffix.length) {
                        h = h.substr(0, h.length - g.suffix.length)
                    }
                    h = h.replace(k, "").replace(g.decimalSeparator, ".");
                    break;
                case "checkbox":
                    var d = (m.colModel.editoptions) ? m.colModel.editoptions.value.split(":") : ["Yes", "No"];
                    h = a("input", e).is(":checked") ? d[0] : d[1];
                    break;
                case "select":
                    h = a.unformat.select(e, m, j, c);
                    break;
                case "actions":
                    return "";
                default:
                    h = a(e).text()
                }
            }
        }
        return h !== undefined ? h: c === true ? a(e).text() : a.jgrid.htmlDecode(a(e).html())
    };
    a.unformat.select = function(g, r, m, d) {
        var l = [];
        var p = a(g).text();
        if (d === true) {
            return p
        }
        var k = a.extend({},
        r.colModel.formatoptions !== undefined ? r.colModel.formatoptions: r.colModel.editoptions),
        s = k.separator === undefined ? ":": k.separator,
        c = k.delimiter === undefined ? ";": k.delimiter;
        if (k.value) {
            var e = k.value,
            q = k.multiple === true ? true: false,
            o = [],
            n;
            if (q) {
                o = p.split(",");
                o = a.map(o,
                function(i) {
                    return a.trim(i)
                })
            }
            if (a.fmatter.isString(e)) {
                var b = e.split(c),
                f = 0,
                h;
                for (h = 0; h < b.length; h++) {
                    n = b[h].split(s);
                    if (n.length > 2) {
                        n[1] = a.map(n,
                        function(t, j) {
                            if (j > 0) {
                                return t
                            }
                        }).join(s)
                    }
                    if (q) {
                        if (a.inArray(n[1], o) > -1) {
                            l[f] = n[0];
                            f++
                        }
                    } else {
                        if (a.trim(n[1]) === a.trim(p)) {
                            l[0] = n[0];
                            break
                        }
                    }
                }
            } else {
                if (a.fmatter.isObject(e) || a.isArray(e)) {
                    if (!q) {
                        o[0] = p
                    }
                    l = a.map(o,
                    function(j) {
                        var i;
                        a.each(e,
                        function(t, u) {
                            if (u === j) {
                                i = t;
                                return false
                            }
                        });
                        if (i !== undefined) {
                            return i
                        }
                    })
                }
            }
            return l.join(", ")
        }
        return p || ""
    };
    a.unformat.date = function(c, b) {
        var d = a.jgrid.formatter.date || {};
        if (b.formatoptions !== undefined) {
            d = a.extend({},
            d, b.formatoptions)
        }
        if (!a.fmatter.isEmpty(c)) {
            return a.jgrid.parseDate(d.newformat, c, d.srcformat, d)
        }
        return a.fn.fmatter.defaultFormat(c, b)
    }
})(jQuery);
var xmlJsonClass = {
    xml2json: function(b, d) {
        if (b.nodeType === 9) {
            b = b.documentElement
        }
        var a = this.removeWhite(b);
        var e = this.toObj(a);
        var c = this.toJson(e, b.nodeName, "\t");
        return "{\n" + d + (d ? c.replace(/\t/g, d) : c.replace(/\t|\n/g, "")) + "\n}"
    },
    json2xml: function(d, c) {
        var e = function(q, f, h) {
            var o = "";
            var l, g;
            if (q instanceof Array) {
                if (q.length === 0) {
                    o += h + "<" + f + ">__EMPTY_ARRAY_</" + f + ">\n"
                } else {
                    for (l = 0, g = q.length; l < g; l += 1) {
                        var p = h + e(q[l], f, h + "\t") + "\n";
                        o += p
                    }
                }
            } else {
                if (typeof(q) === "object") {
                    var k = false;
                    o += h + "<" + f;
                    var j;
                    for (j in q) {
                        if (q.hasOwnProperty(j)) {
                            if (j.charAt(0) === "@") {
                                o += " " + j.substr(1) + '="' + q[j].toString() + '"'
                            } else {
                                k = true
                            }
                        }
                    }
                    o += k ? ">": "/>";
                    if (k) {
                        for (j in q) {
                            if (q.hasOwnProperty(j)) {
                                if (j === "#text") {
                                    o += q[j]
                                } else {
                                    if (j === "#cdata") {
                                        o += "<![CDATA[" + q[j] + "]]>"
                                    } else {
                                        if (j.charAt(0) !== "@") {
                                            o += e(q[j], j, h + "\t")
                                        }
                                    }
                                }
                            }
                        }
                        o += (o.charAt(o.length - 1) === "\n" ? h: "") + "</" + f + ">"
                    }
                } else {
                    if (typeof(q) === "function") {
                        o += h + "<" + f + "><![CDATA[" + q + "]]></" + f + ">"
                    } else {
                        if (q === undefined) {
                            q = ""
                        }
                        if (q.toString() === '""' || q.toString().length === 0) {
                            o += h + "<" + f + ">__EMPTY_STRING_</" + f + ">"
                        } else {
                            o += h + "<" + f + ">" + q.toString() + "</" + f + ">"
                        }
                    }
                }
            }
            return o
        };
        var b = "";
        var a;
        for (a in d) {
            if (d.hasOwnProperty(a)) {
                b += e(d[a], a, "")
            }
        }
        return c ? b.replace(/\t/g, c) : b.replace(/\t|\n/g, "")
    },
    toObj: function(b) {
        var g = {};
        var f = /function/i;
        if (b.nodeType === 1) {
            if (b.attributes.length) {
                var e;
                for (e = 0; e < b.attributes.length; e += 1) {
                    g["@" + b.attributes[e].nodeName] = (b.attributes[e].nodeValue || "").toString()
                }
            }
            if (b.firstChild) {
                var a = 0,
                d = 0,
                c = false;
                var h;
                for (h = b.firstChild; h; h = h.nextSibling) {
                    if (h.nodeType === 1) {
                        c = true
                    } else {
                        if (h.nodeType === 3 && h.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                            a += 1
                        } else {
                            if (h.nodeType === 4) {
                                d += 1
                            }
                        }
                    }
                }
                if (c) {
                    if (a < 2 && d < 2) {
                        this.removeWhite(b);
                        for (h = b.firstChild; h; h = h.nextSibling) {
                            if (h.nodeType === 3) {
                                g["#text"] = this.escape(h.nodeValue)
                            } else {
                                if (h.nodeType === 4) {
                                    if (f.test(h.nodeValue)) {
                                        g[h.nodeName] = [g[h.nodeName], h.nodeValue]
                                    } else {
                                        g["#cdata"] = this.escape(h.nodeValue)
                                    }
                                } else {
                                    if (g[h.nodeName]) {
                                        if (g[h.nodeName] instanceof Array) {
                                            g[h.nodeName][g[h.nodeName].length] = this.toObj(h)
                                        } else {
                                            g[h.nodeName] = [g[h.nodeName], this.toObj(h)]
                                        }
                                    } else {
                                        g[h.nodeName] = this.toObj(h)
                                    }
                                }
                            }
                        }
                    } else {
                        if (!b.attributes.length) {
                            g = this.escape(this.innerXml(b))
                        } else {
                            g["#text"] = this.escape(this.innerXml(b))
                        }
                    }
                } else {
                    if (a) {
                        if (!b.attributes.length) {
                            g = this.escape(this.innerXml(b));
                            if (g === "__EMPTY_ARRAY_") {
                                g = "[]"
                            } else {
                                if (g === "__EMPTY_STRING_") {
                                    g = ""
                                }
                            }
                        } else {
                            g["#text"] = this.escape(this.innerXml(b))
                        }
                    } else {
                        if (d) {
                            if (d > 1) {
                                g = this.escape(this.innerXml(b))
                            } else {
                                for (h = b.firstChild; h; h = h.nextSibling) {
                                    if (f.test(b.firstChild.nodeValue)) {
                                        g = b.firstChild.nodeValue;
                                        break
                                    } else {
                                        g["#cdata"] = this.escape(h.nodeValue)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (!b.attributes.length && !b.firstChild) {
                g = null
            }
        } else {
            if (b.nodeType === 9) {
                g = this.toObj(b.documentElement)
            } else {
                alert("unhandled node type: " + b.nodeType)
            }
        }
        return g
    },
    toJson: function(b, a, d, e) {
        if (e === undefined) {
            e = true
        }
        var p = a ? ('"' + a + '"') : "",
        f = "\t",
        g = "\n";
        if (!e) {
            f = "";
            g = ""
        }
        if (b === "[]") {
            p += (a ? ":[]": "[]")
        } else {
            if (b instanceof Array) {
                var c, k, j = [];
                for (k = 0, c = b.length; k < c; k += 1) {
                    j[k] = this.toJson(b[k], "", d + f, e)
                }
                p += (a ? ":[": "[") + (j.length > 1 ? (g + d + f + j.join("," + g + d + f) + g + d) : j.join("")) + "]"
            } else {
                if (b === null) {
                    p += (a && ":") + "null"
                } else {
                    if (typeof(b) === "object") {
                        var l = [],
                        h;
                        for (h in b) {
                            if (b.hasOwnProperty(h)) {
                                l[l.length] = this.toJson(b[h], h, d + f, e)
                            }
                        }
                        p += (a ? ":{": "{") + (l.length > 1 ? (g + d + f + l.join("," + g + d + f) + g + d) : l.join("")) + "}"
                    } else {
                        if (typeof(b) === "string") {
                            p += (a && ":") + '"' + b.replace(/\\/g, "\\\\").replace(/\"/g, '\\"') + '"'
                        } else {
                            p += (a && ":") + b.toString()
                        }
                    }
                }
            }
        }
        return p
    },
    innerXml: function(d) {
        var b = "";
        if ("innerHTML" in d) {
            b = d.innerHTML
        } else {
            var a = function(j) {
                var g = "",
                f;
                if (j.nodeType === 1) {
                    g += "<" + j.nodeName;
                    for (f = 0; f < j.attributes.length; f += 1) {
                        g += " " + j.attributes[f].nodeName + '="' + (j.attributes[f].nodeValue || "").toString() + '"'
                    }
                    if (j.firstChild) {
                        g += ">";
                        for (var h = j.firstChild; h; h = h.nextSibling) {
                            g += a(h)
                        }
                        g += "</" + j.nodeName + ">"
                    } else {
                        g += "/>"
                    }
                } else {
                    if (j.nodeType === 3) {
                        g += j.nodeValue
                    } else {
                        if (j.nodeType === 4) {
                            g += "<![CDATA[" + j.nodeValue + "]]>"
                        }
                    }
                }
                return g
            };
            for (var e = d.firstChild; e; e = e.nextSibling) {
                b += a(e)
            }
        }
        return b
    },
    escape: function(a) {
        return a.replace(/[\\]/g, "\\\\").replace(/[\"]/g, '\\"').replace(/[\n]/g, "\\n").replace(/[\r]/g, "\\r")
    },
    removeWhite: function(b) {
        b.normalize();
        var c;
        for (c = b.firstChild; c;) {
            if (c.nodeType === 3) {
                if (!c.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                    var a = c.nextSibling;
                    b.removeChild(c);
                    c = a
                } else {
                    c = c.nextSibling
                }
            } else {
                if (c.nodeType === 1) {
                    this.removeWhite(c);
                    c = c.nextSibling
                } else {
                    c = c.nextSibling
                }
            }
        }
        return b
    }
};