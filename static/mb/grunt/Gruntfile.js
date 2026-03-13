module.exports = function(grunt) {
    var config = {
        name: "megabox",
        path: '../../../',
        mobilePath: '../../../static/mb/',
        pcPath: '../../../static/pc/'
    };

    grunt.initConfig({
        megaconfig: config,
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                block : true,
                line : true,
                stripBanners : true
            },
            mobile: {
                src: [
                      '<%=megaconfig.mobilePath%>/js/intersection-observer.js'
                      ,'<%=megaconfig.mobilePath%>/js/lozad.min.js'
                      ,'<%=megaconfig.mobilePath%>/js/stringBuffer.js'
                      ,'<%=megaconfig.mobilePath%>/js/bootstrap-custom.js'
                      ,'<%=megaconfig.mobilePath%>/js/bootstrap-select.js'
                      ,'<%=megaconfig.mobilePath%>/js/ui.common.js'
                      ,'<%=megaconfig.mobilePath%>/js/front.js'
                      ,'<%=megaconfig.mobilePath%>/js/AppHeader.js'
                      ,'<%=megaconfig.mobilePath%>/js/AppDomain.js'
                      ,'<%=megaconfig.mobilePath%>/js/AppHandler.js'
                      ,'<%=megaconfig.mobilePath%>/js/serializeObject.js'
                      ,'<%=megaconfig.mobilePath%>/js/mobileLayout.js'
                      ,'<%=megaconfig.mobilePath%>/js/infiniteScroll.js'
                    ],
                dest: '<%=megaconfig.mobilePath%>/dist/<%= megaconfig.name %>.mobile.js'
            },
            netFunnel: {
                src: [
                      '<%=megaconfig.path%>/js/netfunnel/netfunnel.js'
                      ,'<%=megaconfig.path%>/js/netfunnel/netfunnel_frm.js'
                      ,'<%=megaconfig.path%>/js/netfunnel/netfunnel_skin.js'
                    ],
                dest: '<%=megaconfig.path%>/js/netfunnel/dist/<%= megaconfig.name %>.netfunnel.js'
            },
            common: {
                src: [
                      '<%=megaconfig.path%>/js/megaboxCom.js'
                      ,'<%=megaconfig.path%>/js/common/mega.prototype.js'
                      ,'<%=megaconfig.path%>/js/common/commons.js'
                    ],
                dest: '<%=megaconfig.path%>/js/common/dist/<%= megaconfig.name %>.common.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= megaconfig.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                preserveComments : false
            },
            mobile: {
                files: {
                    '<%=megaconfig.mobilePath%>/dist/<%= megaconfig.name %>.mobile.min.js': ['<%= concat.mobile.dest %>']
                    , '<%=megaconfig.mobilePath%>/dist/<%= megaconfig.name %>.mobile.main.min.js': ['<%=megaconfig.mobilePath%>/js/main.js']
                }
            },
            netFunnel: {
                files: {
                    '<%=megaconfig.path%>/js/netfunnel/dist/<%= megaconfig.name %>.netfunnel.min.js': ['<%= concat.netFunnel.dest %>']
                }
            },
            common: {
                files: {
                    '<%=megaconfig.path%>/js/common/dist/<%= megaconfig.name %>.common.min.js': ['<%= concat.common.dest %>']
                }
            }
        },
        cssmin: {
            mobile : {
              src : [
                     "<%=megaconfig.mobilePath%>/css/reset.css"
                     ,"<%=megaconfig.mobilePath%>/css/jquery-ui-1.12.1.css"
                     ,"<%=megaconfig.mobilePath%>/css/notosanskr.css"
                     ,"<%=megaconfig.mobilePath%>/css/roboto.css"
                     ,"<%=megaconfig.mobilePath%>/css/common.css"
                     ,"<%=megaconfig.mobilePath%>/css/contents.css"
                     ,"<%=megaconfig.mobilePath%>/css/swiper.css"
                     ,"<%=megaconfig.mobilePath%>/css/demo.css"
                     ,"<%=megaconfig.mobilePath%>/css/perfect-scrollbar.css"
                   ],
 		         dest : "<%=megaconfig.mobilePath%>/dist/<%= megaconfig.name %>.mobile.min.css"
            },
            pc : {
                src : [
                       "<%=megaconfig.pcPath%>/css/reset.css"
                       ,"<%=megaconfig.pcPath%>/css/jquery-ui-1.12.1.css"
                       ,"<%=megaconfig.pcPath%>/css/nanumbarungothic.css"
                       ,"<%=megaconfig.pcPath%>/css/roboto.css"
                       ,"<%=megaconfig.pcPath%>/css/disc-font.css"
                       ,"<%=megaconfig.pcPath%>/css/jquery.mCustomScrollbar.css"
                       ,"<%=megaconfig.pcPath%>/css/swiper.css"
                       ,"<%=megaconfig.pcPath%>/css/bootstrap.css"
                       ,"<%=megaconfig.pcPath%>/css/bootstrap-select.css"
                       ,"<%=megaconfig.pcPath%>/css/common.css"
                       ,"<%=megaconfig.pcPath%>/css/contents.css"
                     ],
   		         dest : "<%=megaconfig.pcPath%>/dist/<%= megaconfig.name %>.min.css"
              },
            mobileNetfunnel :{
                src : [
                    "<%=megaconfig.mobilePath%>/css/netfunnel.css"
                  ],
		         dest : "<%=megaconfig.mobilePath%>/dist/<%= megaconfig.name %>.netfunnel.min.css"
           },
           pcNetfunnel :{
               src : [
                   "<%=megaconfig.pcPath%>/css/netfunnel.css"
                 ],
		         dest : "<%=megaconfig.pcPath%>/dist/<%= megaconfig.name %>.netfunnel.min.css"
           }
         }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
};
