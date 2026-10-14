FROM amazoncorretto:25 AS builder

WORKDIR /app

COPY build/libs/*.jar app.jar

RUN java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

FROM amazoncorretto:25

WORKDIR /app

COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
