const int trigPin = 10;
const int echoPin = 9;

int motor1pin1 = 2;
int motor1pin2 = 3; // ANALOG

int motor2pin1 = 4;
int motor2pin2 = 5; //ANALOG

int enablePinA = 6;
int enablePinB = 11;

const int thresholdDistance = 10; // distance in cm to trigger motors

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(motor1pin1, OUTPUT);
  pinMode(motor1pin2, OUTPUT);
  pinMode(motor2pin1, OUTPUT);
  pinMode(motor2pin2, OUTPUT);
  Serial.begin(9600);
  pinMode(enablePinA, OUTPUT);
  pinMode(enablePinB, OUTPUT);

  analogWrite(6,141); //ENA  pin
  analogWrite(11, 108); //ENB pin
}

void loop() {
  int distance = checkSensor();

  if (distance > 0 && distance <= thresholdDistance) {
    stop();
    driveBackward(150);
    delay(500);
    turnLeft(200);
    delay(500);
    stop();
    distance = checkSensor();
    if (distance > 0 && distance <= thresholdDistance) {
      turnRight(200);
      stop();
      driveBackward(150);
      delay(500);
      distance = checkSensor();
      delay(500);
      if (distance > 0 && distance <= thresholdDistance) {
        turnLeft(200);
        stop();
        driveBackward(150);
        delay(500);
      } else {
        driveForward(500);
        delay(500);
      }
    } else {
      driveForward(500);
      delay(500);
    }
  } else {
    driveForward(500);
  }
}

void driveForward(int delayTime) {
  digitalWrite(motor1pin1,   HIGH);
  digitalWrite(motor1pin2, LOW);

  digitalWrite(motor2pin1,   HIGH);
  digitalWrite(motor2pin2, LOW);
  delay(delayTime);
}
void turnLeft(int delayTime) {
  digitalWrite(motor1pin1,   LOW);
  digitalWrite(motor1pin2, HIGH);

  digitalWrite(motor2pin1,   HIGH);
  digitalWrite(motor2pin2, LOW);
  delay(delayTime);
}
void turnRight(int delayTime) {
  digitalWrite(motor1pin1,   HIGH);
  digitalWrite(motor1pin2, LOW);

  digitalWrite(motor2pin1,   LOW);
  digitalWrite(motor2pin2, HIGH);
  delay(delayTime);
}
void driveBackward(int delayTime) {
  digitalWrite(motor1pin1,   LOW);
  digitalWrite(motor1pin2, HIGH);

  digitalWrite(motor2pin1,   LOW);
  digitalWrite(motor2pin2, HIGH);
  delay(delayTime);
}
void stop() {
  digitalWrite(motor1pin1,   LOW);
  digitalWrite(motor1pin2, LOW);

  digitalWrite(motor2pin1, LOW);
  digitalWrite(motor2pin2, LOW);
}
int checkSensor() {
  long duration;
  int distance;
  // Trigger ultrasonic pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Measure echo return time
  duration = pulseIn(echoPin, HIGH);

  // Calculate distance (cm)
  distance = duration * 0.034 / 2;

  // Print distance to Serial Monitor
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  return distance;
}
