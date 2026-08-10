FROM eclipse-temurin:17
RUN wget -qO /opt/checkstyle.jar https://github.com/checkstyle/checkstyle/releases/download/checkstyle-10.12.5/checkstyle-10.12.5-all.jar
RUN useradd -m -u 1000 runner
USER runner
WORKDIR /box
COPY run.sh /run.sh
ENTRYPOINT ["sh", "/run.sh"]
