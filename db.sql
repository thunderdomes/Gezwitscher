CREATE TABLE IF NOT EXISTS `tb_LA` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `id_twit` int(100) NOT NULL,
  `from` text NOT NULL,
  `profile_image_url` text NOT NULL,
  `date_twit` text NOT NULL,
  `img_url` text NOT NULL,
  `content` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `no` int(100),
  `filter` varchar(100),
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=176 ;