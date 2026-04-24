FROM ubuntu:16.04

RUN apt-get update \
    && apt-get install -y wget build-essential pkg-config qt4-qmake libqt4-dev \
    && mkdir -p /ttfautohint && cd /ttfautohint

ENV FT_VERSION=2.6.3
ENV HB_VERSION=1.2.7
ENV TA_VERSION=1.5

RUN wget http://download.savannah.gnu.org/releases/freetype/freetype-"$FT_VERSION".tar.bz2 \
    && tar xjf freetype-"$FT_VERSION".tar.bz2 \
    && (cd freetype-"$FT_VERSION" && ./configure --without-harfbuzz && make install && make distclean) \
    && wget https://www.freedesktop.org/software/harfbuzz/release/harfbuzz-"$HB_VERSION".tar.bz2 \
    && tar xjf harfbuzz-"$HB_VERSION".tar.bz2 \
    && (cd harfbuzz-"$HB_VERSION" && ./configure && make install) \
    && (cd freetype-"$FT_VERSION" && ./configure && make install) \
    && wget http://downloads.sourceforge.net/project/freetype/ttfautohint/"$TA_VERSION"/ttfautohint-"$TA_VERSION".tar.gz \
    && tar xzf ttfautohint-"$TA_VERSION".tar.gz \
    && (cd ttfautohint-"$TA_VERSION" && ./configure && make install)

ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

ENTRYPOINT ["/usr/local/bin/ttfautohint"]
CMD ["/dev/stdin", "/dev/stdout"]
