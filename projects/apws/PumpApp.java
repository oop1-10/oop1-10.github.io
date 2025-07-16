import org.firmata4j.I2CDevice;
import org.firmata4j.IODevice;
import org.firmata4j.Pin;
import org.firmata4j.firmata.FirmataDevice;
import org.firmata4j.ssd1306.SSD1306;

import org.knowm.xchart.QuickChart;
import org.knowm.xchart.XYChart;
import org.knowm.xchart.SwingWrapper;


import java.io.IOException;
import java.util.ArrayList;
import java.util.Timer;

public class PumpApp {

    private final String myPort = "/dev/cu.usbserial-0001"; // modify for your own computer & setup.
    private IODevice myGroveBoard;
    private SSD1306 myOled;

    /**
     * Constructor for a ButtonApp
     */
    public PumpApp() {

        this.myGroveBoard = new FirmataDevice(this.myPort);

        try {
            this.myGroveBoard.start(); // start communication with board;
            this.myGroveBoard.ensureInitializationIsDone();
            System.out.println("Board started.");

            // Initialize the OLED (SSD1306) object
            I2CDevice i2cObject = this.myGroveBoard.getI2CDevice((byte) 0x3C); // Use 0x3C for the Grove OLED
            this.myOled = new SSD1306(i2cObject, SSD1306.Size.SSD1306_128_64); // 128x64 OLED SSD1515
            this.myOled.init();
        } catch (Exception ex) { // if not, detail the error.
            System.out.println("couldn't connect to board.");
            return; //no point continuing at this point.
        }

        /*
         * Defining the pins associated with the groveboard
         */
        Pin buttonPin = myGroveBoard.getPin(6); Pin ledPin = myGroveBoard.getPin(4);
        Pin pumpPin = myGroveBoard.getPin(2); Pin moisturePin = myGroveBoard.getPin(15);

        try {
            /*
             * Set pins to their individual modes
             * MOISTURE pin must be set to ANALOG, since we want a value intermediate of 1 and 0
             */
            buttonPin.setMode(Pin.Mode.INPUT);
            ledPin.setMode(Pin.Mode.OUTPUT);
            pumpPin.setMode(Pin.Mode.OUTPUT);
            moisturePin.setMode(Pin.Mode.ANALOG);

            ArrayList<Double> timePast = new ArrayList<>();
            ArrayList<Double> moistureData = new ArrayList<>();
            timePast.add(1.0);
            moistureData.add((double) moisturePin.getValue());

            /*
             * External library associated with the chart, provides a real-time updating graph, creation of object below
             */

            final XYChart chart = QuickChart.getChart("Moisture Vs Time Graph", "Time (s)", "Moisture (V)", "Moisture", timePast, moistureData);

            final SwingWrapper<XYChart> sw = new SwingWrapper<>(chart);
            sw.displayChart(); // show the chart

            Timer timer = new Timer(true); // create the timer object
            PumpTask pump = new PumpTask(ledPin, buttonPin, moisturePin, pumpPin, timer, myGroveBoard, myOled, timePast, moistureData, chart, sw);
            timer.scheduleAtFixedRate(pump, 2500, 1000);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Stop the Board
     *
     * @throws IOException
     */
    private void stopApp() throws IOException {
        this.myGroveBoard.stop();
    }


    public static void main(String[] args) {
        PumpApp app = new PumpApp(); // run the pump app
    }
}
