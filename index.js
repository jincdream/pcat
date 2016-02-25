'use strict'
var fis = module.exports = require('fis-mini');
var shell = require('child_process').exec

fis.require.prefixes.unshift('pcat');
fis.cli.name = 'pcat';
fis.cli.info = require('./package.json');

var path = require('path')
var isMaster = !~process.argv.indexOf('--child-flag')
    // fis.pcSub = function(){
    //   isMaster && console.log('-------------------------- ',fis.get('output'),' --------------------------')

//   isMaster && shell('start ' + 'chrome' + ' "'+ 'http://127.0.0.1:8090/' + fis.get('namespace') + '/index.html?t=' +(+new Date) +'"')
// }
fis.set('project.ignore',['output/**','fis-conf.js']); // set 为覆盖不是叠加

fis.pcat = function(option) {
    var fis = this
    const packageJson = option.packageJson
    const site = path.resolve(fis.project.getProjectPath(), "../").split(path.sep).pop()
    // var pcat = fis.get('pcat');
    const media = fis.project.currentMedia()

    // 设置输出路径 
    const outputDir = path.resolve(fis.project.getProjectPath(), "../../_output")

    const MAP_DIR =  path.resolve(outputDir, media, "map", site)
    const STATIC_DIR = path.resolve(outputDir, media, "static", site)
    const TEMP_DIR = path.resolve(outputDir, media, "template", site)
    const PAGE_DIR = path.resolve(outputDir, media, "page", site)

    const DOMAIN = option.domain

    fis.set("PCAT", {
        useCombo: option.combo,
        project: packageJson.name,
        version: packageJson.version,
        media: media,
        site: site,
        tagName: "widget" //约束为与组件目录同名
    });
    fis.set('namespace', packageJson.name);
    fis.set('pc-project', packageJson.name);
    fis.set('pc-version', packageJson.version);

    fis
      .match('(*)', {
        release: false,
        domain:DOMAIN[media] + '/' + site
      })
      .hook('commonjs')
      .media(media)
      .match(/^\/page\/(.*\/)*([^\/]+\.js$)/i, {
          useHash: true,
          release: "${pc-project}/${pc-version}/j/$2",
          deploy: fis.plugin('local-deliver', {
              to: STATIC_DIR
          }),
          extras: {
            comboTo:'7'
          }
      })
      .match(/^\/page\/(.*\/)*([^\/]+\.(?:css|less|scss)$)/i, {
          useHash: true,
          release: "${pc-project}/${pc-version}/c/$2",
          deploy: fis.plugin('local-deliver', {
              to: STATIC_DIR
          }),
          extras: {
            comboTo:'7'
          }
      })
      .match(/^\/page\/(.*\/)*([^\/]+\.html$)/i, {
        // useHash: true,
        useSameNameRequire: true,
        isPage: true,
        extras: {
            isPage: true
        },
        useMap: true,
        release: "${pc-project}/${pc-version}/$2",
        deploy: fis.plugin('local-deliver', {
            to: PAGE_DIR
        })
      })
      .match(/^\/page\/(.*\/)*([^\/]+\.(?:png|jpg|gif)$)/i, {
          useHash: true,
          useMap:!0,
          release: "${pc-project}/${pc-version}/i/$2",
          deploy: fis.plugin('local-deliver', {
              to: STATIC_DIR
          })
      })
      .match(/^\/widget\/(.*\/)*([^\/]+\.js$)/i, {
          useHash: true,
          release: "${pc-project}/${pc-version}/j/$2",
          deploy: fis.plugin('local-deliver', {
              to: STATIC_DIR
          }),
          isMod:!0,
          extras: {
            comboTo:'6'
          }
      })
      .match(/^\/widget\/(.*\/)*([^\/]+\.(?:css|less|scss)$)/i, {
        useHash: true,
        release: "${pc-project}/${pc-version}/c/$2",
        deploy: fis.plugin('local-deliver', {
            to: STATIC_DIR
        }),
        extras: {
          comboTo:'6'
        }
      })
      .match(/^\/widget\/(.*\/)*([^\/]+\.(?:png|jpg|gif)$)/i, {
          useHash: true,
          release: "${pc-project}/${pc-version}/i/$2",
          deploy: fis.plugin('local-deliver', {
              to: STATIC_DIR
          })
      })
      .match(/^\/widget\/(.*\/)*([^\/]+\.(?:html|cms|tpl)$)/i, {
          useHash: true,
          isHtmlLike: true,
          isWidget: true,
          useSameNameRequire: true,
          useMap: true,
          release: "${pc-project}/${pc-version}/$2",
          deploy: fis.plugin('local-deliver', {
              to: TEMP_DIR
          }),
          domain: ''
      })
      .match(/^\/node_modules\/(pc\-.*?)\/index\.js/i,{
        useHash: true,
        release: "${pc-project}/${pc-version}/j/$1.js",
        id: "$1",
        moduleId:packageJson.name + ":$1",
        requireId:packageJson.name + ":$1",
        deploy: fis.plugin('local-deliver', {
            to: STATIC_DIR
        }),
        alies:"$1",
        isMod:!0,
        extras: {
          comboTo:'5'
        }
      })
      .match(/^\/node_modules\/(pc\-.*?)\/([^index]\.js)/i,{
        useHash: true,
        release: "${pc-project}/${pc-version}/j/$1_$2",
        deploy: fis.plugin('local-deliver', {
            to: STATIC_DIR
        }),
        isMod:!0,
        extras: {
          comboTo:'5'
        }
      })
      .match('/node_modules/pc-require/*.js',{
        isMod:!1,
        extras: {
          comboTo:'-111'
        }
      })
      .match('/node_modules/pc-jquery/*.js',{
        extras: {
          comboTo:'-112'
        }
      })
      .match("*.html", {
          parser: fis.plugin("widget-load", {
              project: fis.get("PCAT.project"),
              tagName: fis.get("PCAT.tagName"),
              mapOutputPath: MAP_DIR,
              templateOutputPath: TEMP_DIR
          })
      })
      .match('**.css', {
        useSprite: true
      })
      .match('**.{sass,scss}', {
        useSprite: true,
        parser: fis.plugin('sass2'),
        rExt: '.css'
      })
      .match('**.less', {
        useSprite: true,
        parser: fis.plugin('less'),
        rExt: '.css'
      })
      .match("::package", {
          packager: fis.plugin("widget-render", {
            tagName: fis.get("PCAT.tagName"),
            mapOutputPath: MAP_DIR
          }),
          postpackager: fis.plugin("autocombo",{
            domain: DOMAIN[media] + '/' + site,
            combo: fis.get("PCAT.useCombo")
          }),
          spriter: fis.plugin('csssprites')
      })
      .match("*map.json", {
          useHash: false,
          release: "${pc-project}/${pc-version}/$0",
          deploy: fis.plugin('local-deliver', {
              to: MAP_DIR
          })
      })
      if(media === 'qa' || media === 'ol'){
        fis
          .match('*.{scss,sass,less,css}', {
            optimizer: fis.plugin('clean-css')
          })
          .match('*.js',{
            optimizer: fis.plugin('uglify-js')
          })
          .match('*.png',{
            optimizer: fis.plugin('png-compressor')
          })
      }
}
